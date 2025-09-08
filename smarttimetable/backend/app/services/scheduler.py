from typing import List, Dict, Tuple, Optional, Set
import logging
from ortools.sat.python import cp_model
from sqlalchemy.orm import Session

from app.db import models
from app.schemas import timetable as schemas

logger = logging.getLogger(__name__)

class TimetableScheduler:
    def __init__(self, db: Session):
        self.db = db
        self.rooms = db.query(models.Room).all()
        self.faculty = db.query(models.Faculty).all()
        self.batches = db.query(models.Batch).all()
        self.subjects = db.query(models.Subject).all()
        self.fixed_slots = db.query(models.FixedSlot).all()
        
        # Constants for the problem
        self.days = 6  # Monday to Saturday
        self.periods_per_day = 8
        self.total_periods = self.days * self.periods_per_day
        
        # Initialize the CP-SAT model
        self.model = cp_model.CpModel()
        
    def generate_timetable_variants(self, num_variants: int = 3) -> List[Dict]:
        """Generate multiple timetable variants"""
        # Define the main decision variables
        assignments = {}
        for b in range(len(self.batches)):
            for s in range(len(self.subjects)):
                for p in range(self.total_periods):
                    for r in range(len(self.rooms)):
                        for f in range(len(self.faculty)):
                            var_name = f'X[{b},{s},{p},{r},{f}]'
                            assignments[(b, s, p, r, f)] = self.model.NewBoolVar(var_name)
        
        # Add constraints
        self._add_constraints(assignments)
        
        # Set optimization objectives
        self._set_objectives(assignments)
        
        # Solve the model
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 120  # 2 minutes time cap
        
        # Enable solution pool for finding multiple solutions
        solution_printer = SolutionCollector(assignments, self, num_variants)
        status = solver.Solve(self.model, solution_printer)
        
        if status == cp_model.INFEASIBLE:
            return self._generate_constraint_relaxation_suggestions()
        
        # Return the top variants
        return solution_printer.get_solutions()
    
    def _add_constraints(self, assignments):
        """Add all constraints to the model"""
        self._add_faculty_room_overlap_constraints(assignments)
        self._add_room_capacity_constraints(assignments)
        self._add_subject_weekly_period_constraints(assignments)
        self._add_faculty_load_constraints(assignments)
        self._add_fixed_slot_constraints(assignments)
    
    def _add_faculty_room_overlap_constraints(self, assignments):
        """C1: No faculty or room overlaps."""
        # Faculty can't be in two places at once
        for f in range(len(self.faculty)):
            for p in range(self.total_periods):
                # Sum of all assignments for this faculty in this period must be <= 1
                period_sum = []
                for b in range(len(self.batches)):
                    for s in range(len(self.subjects)):
                        for r in range(len(self.rooms)):
                            period_sum.append(assignments[(b, s, p, r, f)])
                self.model.Add(sum(period_sum) <= 1)
        
        # Room can't have two classes at once
        for r in range(len(self.rooms)):
            for p in range(self.total_periods):
                # Sum of all assignments for this room in this period must be <= 1
                period_sum = []
                for b in range(len(self.batches)):
                    for s in range(len(self.subjects)):
                        for f in range(len(self.faculty)):
                            period_sum.append(assignments[(b, s, p, r, f)])
                self.model.Add(sum(period_sum) <= 1)
        
        # Batch can't have two classes at once
        for b in range(len(self.batches)):
            for p in range(self.total_periods):
                # Sum of all assignments for this batch in this period must be <= 1
                period_sum = []
                for s in range(len(self.subjects)):
                    for r in range(len(self.rooms)):
                        for f in range(len(self.faculty)):
                            period_sum.append(assignments[(b, s, p, r, f)])
                self.model.Add(sum(period_sum) <= 1)
    
    def _add_room_capacity_constraints(self, assignments):
        """C2: Room capacity ≥ batch size."""
        for b in range(len(self.batches)):
            batch_size = self.batches[b].size
            for r in range(len(self.rooms)):
                room_capacity = self.rooms[r].capacity
                # If room is too small, batch can't use it
                if batch_size > room_capacity:
                    for s in range(len(self.subjects)):
                        for p in range(self.total_periods):
                            for f in range(len(self.faculty)):
                                self.model.Add(assignments[(b, s, p, r, f)] == 0)
    
    def _add_subject_weekly_period_constraints(self, assignments):
        """C3: Subject must meet its weekly period requirement."""
        for b in range(len(self.batches)):
            for s in range(len(self.subjects)):
                subject = self.subjects[s]
                # Get the total hours required for this subject
                hours_needed = subject.hours_week
                
                # Sum of all periods scheduled for this subject must equal required hours
                subject_periods = []
                for p in range(self.total_periods):
                    for r in range(len(self.rooms)):
                        for f in range(len(self.faculty)):
                            subject_periods.append(assignments[(b, s, p, r, f)])
                
                self.model.Add(sum(subject_periods) == hours_needed)
    
    def _add_faculty_load_constraints(self, assignments):
        """C4: Faculty max-periods/day & week respected."""
        for f in range(len(self.faculty)):
            faculty = self.faculty[f]
            max_day = faculty.max_day
            max_week = faculty.max_week
            
            # Weekly load constraint
            weekly_load = []
            for p in range(self.total_periods):
                for b in range(len(self.batches)):
                    for s in range(len(self.subjects)):
                        for r in range(len(self.rooms)):
                            weekly_load.append(assignments[(b, s, p, r, f)])
            
            self.model.Add(sum(weekly_load) <= max_week)
            
            # Daily load constraint
            for day in range(self.days):
                day_load = []
                for period in range(self.periods_per_day):
                    p = day * self.periods_per_day + period
                    for b in range(len(self.batches)):
                        for s in range(len(self.subjects)):
                            for r in range(len(self.rooms)):
                                day_load.append(assignments[(b, s, p, r, f)])
                
                self.model.Add(sum(day_load) <= max_day)
    
    def _add_fixed_slot_constraints(self, assignments):
        """C5: Fixed slots are immutable."""
        # For each fixed slot, enforce the slot constraints
        for fixed_slot in self.fixed_slots:
            # Calculate the period index
            p = fixed_slot.day * self.periods_per_day + fixed_slot.period - 1
            batch_index = next((i for i, b in enumerate(self.batches) if b.id == fixed_slot.batch_id), None)
            
            if batch_index is not None:
                # This batch can't have any other classes in this period
                for s in range(len(self.subjects)):
                    for r in range(len(self.rooms)):
                        for f in range(len(self.faculty)):
                            if fixed_slot.room_id is not None:
                                # If the fixed slot has a room, only allow that specific room
                                room_index = next((i for i, r in enumerate(self.rooms) if r.id == fixed_slot.room_id), None)
                                if r != room_index:
                                    self.model.Add(assignments[(batch_index, s, p, r, f)] == 0)
                            else:
                                # If the fixed slot doesn't specify a room, just make sure the batch isn't scheduled elsewhere
                                for other_r in range(len(self.rooms)):
                                    if r != other_r:
                                        self.model.Add(assignments[(batch_index, s, p, r, f)] + 
                                                       assignments[(batch_index, s, p, other_r, f)] <= 1)
    
    def _set_objectives(self, assignments):
        """Set optimization goals in lexicographic order"""
        # G1: Minimize total idle gaps for faculty
        idle_gaps = self._calculate_faculty_idle_gaps(assignments)
        
        # G2: Maximize room utilization
        room_usage = self._calculate_room_utilization(assignments)
        
        # G3: Balance teaching load across faculty
        load_imbalance = self._calculate_load_imbalance(assignments)
        
        # Combined objective with weights
        self.model.Minimize(10000 * idle_gaps + 100 * (-room_usage) + load_imbalance)
    
    def _calculate_faculty_idle_gaps(self, assignments):
        """Calculate total idle gaps for faculty"""
        total_gaps = self.model.NewIntVar(0, 1000, 'total_gaps')
        all_gaps = []
        
        for f in range(len(self.faculty)):
            for day in range(self.days):
                # For each day, track if faculty is scheduled in each period
                period_scheduled = []
                for period in range(self.periods_per_day):
                    p = day * self.periods_per_day + period
                    scheduled = self.model.NewBoolVar(f'scheduled_f{f}_day{day}_p{period}')
                    
                    # Faculty is scheduled if they have any assignment in this period
                    period_sum = []
                    for b in range(len(self.batches)):
                        for s in range(len(self.subjects)):
                            for r in range(len(self.rooms)):
                                period_sum.append(assignments[(b, s, p, r, f)])
                    
                    self.model.Add(sum(period_sum) >= 1).OnlyEnforceIf(scheduled)
                    self.model.Add(sum(period_sum) == 0).OnlyEnforceIf(scheduled.Not())
                    
                    period_scheduled.append(scheduled)
                
                # Count gaps: a gap is when there's no assignment between two assignments
                for i in range(1, self.periods_per_day - 1):
                    gap = self.model.NewBoolVar(f'gap_f{f}_day{day}_p{i}')
                    
                    # A gap exists if current period is free but some earlier and later periods are scheduled
                    has_earlier = self.model.NewBoolVar(f'has_earlier_f{f}_day{day}_p{i}')
                    has_later = self.model.NewBoolVar(f'has_later_f{f}_day{day}_p{i}')
                    
                    earlier_sum = []
                    for j in range(i):
                        earlier_sum.append(period_scheduled[j])
                    
                    later_sum = []
                    for j in range(i+1, self.periods_per_day):
                        later_sum.append(period_scheduled[j])
                    
                    self.model.Add(sum(earlier_sum) >= 1).OnlyEnforceIf(has_earlier)
                    self.model.Add(sum(earlier_sum) == 0).OnlyEnforceIf(has_earlier.Not())
                    
                    self.model.Add(sum(later_sum) >= 1).OnlyEnforceIf(has_later)
                    self.model.Add(sum(later_sum) == 0).OnlyEnforceIf(has_later.Not())
                    
                    # A gap exists if this period isn't scheduled but there are scheduled periods before and after
                    self.model.AddBoolAnd([has_earlier, period_scheduled[i].Not(), has_later]).OnlyEnforceIf(gap)
                    self.model.AddBoolOr([has_earlier.Not(), period_scheduled[i], has_later.Not()]).OnlyEnforceIf(gap.Not())
                    
                    all_gaps.append(gap)
        
        self.model.Add(total_gaps == sum(all_gaps))
        return total_gaps
    
    def _calculate_room_utilization(self, assignments):
        """Calculate room utilization (higher is better)"""
        total_usage = self.model.NewIntVar(0, 1000, 'total_room_usage')
        all_usage = []
        
        for r in range(len(self.rooms)):
            for p in range(self.total_periods):
                # Room is utilized if any assignment uses it in this period
                room_used = self.model.NewBoolVar(f'room{r}_used_p{p}')
                
                period_sum = []
                for b in range(len(self.batches)):
                    for s in range(len(self.subjects)):
                        for f in range(len(self.faculty)):
                            period_sum.append(assignments[(b, s, p, r, f)])
                
                self.model.Add(sum(period_sum) >= 1).OnlyEnforceIf(room_used)
                self.model.Add(sum(period_sum) == 0).OnlyEnforceIf(room_used.Not())
                
                all_usage.append(room_used)
        
        self.model.Add(total_usage == sum(all_usage))
        return total_usage
    
    def _calculate_load_imbalance(self, assignments):
        """Calculate load imbalance (standard deviation approximation)"""
        # Calculate each faculty's teaching load
        faculty_loads = []
        for f in range(len(self.faculty)):
            load = self.model.NewIntVar(0, 100, f'faculty{f}_load')
            
            load_sum = []
            for p in range(self.total_periods):
                for b in range(len(self.batches)):
                    for s in range(len(self.subjects)):
                        for r in range(len(self.rooms)):
                            load_sum.append(assignments[(b, s, p, r, f)])
            
            self.model.Add(load == sum(load_sum))
            faculty_loads.append(load)
        
        # Calculate average load
        avg_load = self.model.NewIntVar(0, 100, 'avg_load')
        self.model.Add(len(self.faculty) * avg_load == sum(faculty_loads))
        
        # Calculate imbalance as sum of absolute differences from average
        imbalance = self.model.NewIntVar(0, 1000, 'imbalance')
        abs_diffs = []
        for f in range(len(self.faculty)):
            diff = self.model.NewIntVar(-100, 100, f'diff{f}')
            abs_diff = self.model.NewIntVar(0, 100, f'abs_diff{f}')
            
            self.model.Add(diff == faculty_loads[f] - avg_load)
            self.model.AddAbsEquality(abs_diff, diff)
            
            abs_diffs.append(abs_diff)
        
        self.model.Add(imbalance == sum(abs_diffs))
        return imbalance
    
    def _generate_constraint_relaxation_suggestions(self):
        """Generate suggestions for resolving infeasible timetable"""
        suggestions = []
        
        # Check room capacity constraints
        room_suggestions = self._check_room_capacity_constraints()
        if room_suggestions:
            suggestions.extend(room_suggestions)
        
        # Check faculty workload constraints
        faculty_suggestions = self._check_faculty_workload_constraints()
        if faculty_suggestions:
            suggestions.extend(faculty_suggestions)
        
        # Check subject period requirements
        subject_suggestions = self._check_subject_period_requirements()
        if subject_suggestions:
            suggestions.extend(subject_suggestions)
        
        return {"error": "No feasible timetable exists", "suggestions": suggestions}
    
    def _check_room_capacity_constraints(self):
        """Check if room capacity is a bottleneck"""
        suggestions = []
        
        # Count how many batches can't fit in any room
        for batch in self.batches:
            suitable_rooms = sum(1 for room in self.rooms if room.capacity >= batch.size)
            if suitable_rooms == 0:
                suggestions.append({
                    "type": "room_capacity",
                    "message": f"Batch '{batch.name}' with {batch.size} students doesn't fit in any available room.",
                    "solution": f"Add a room with capacity of at least {batch.size} students."
                })
        
        return suggestions
    
    def _check_faculty_workload_constraints(self):
        """Check if faculty workload constraints are too tight"""
        suggestions = []
        
        # Calculate total teaching hours required and available
        total_subject_hours = sum(subject.hours_week for subject in self.subjects)
        total_faculty_capacity = sum(faculty.max_week for faculty in self.faculty)
        
        if total_subject_hours > total_faculty_capacity:
            suggestions.append({
                "type": "faculty_workload",
                "message": f"Total required teaching hours ({total_subject_hours}) exceeds faculty capacity ({total_faculty_capacity}).",
                "solution": "Increase faculty max weekly load or add more faculty members."
            })
        
        return suggestions
    
    def _check_subject_period_requirements(self):
        """Check if subject period requirements can be met"""
        suggestions = []
        
        # Check if any batch has too many total periods
        for batch in self.batches:
            batch_subjects = [s for s in self.subjects if s.semester == batch.semester]
            total_batch_hours = sum(s.hours_week for s in batch_subjects)
            max_possible_hours = self.days * self.periods_per_day
            
            if total_batch_hours > max_possible_hours:
                suggestions.append({
                    "type": "subject_hours",
                    "message": f"Batch '{batch.name}' requires {total_batch_hours} total hours, but only {max_possible_hours} are available.",
                    "solution": f"Reduce total subject hours or increase available periods per week."
                })
        
        return suggestions

class SolutionCollector(cp_model.CpSolverSolutionCallback):
    """Callback to collect multiple solutions"""
    
    def __init__(self, assignments, scheduler, solution_limit):
        cp_model.CpSolverSolutionCallback.__init__(self)
        self._assignments = assignments
        self._scheduler = scheduler
        self._solution_limit = solution_limit
        self._solutions = []
    
    def on_solution_callback(self):
        """Called when a new solution is found"""
        if len(self._solutions) < self._solution_limit:
            solution = self._extract_solution()
            self._solutions.append(solution)
    
    def _extract_solution(self):
        """Extract the current solution"""
        solution = {"periods": []}
        
        for (b, s, p, r, f), var in self._assignments.items():
            if self.Value(var) == 1:
                # This assignment is active in the solution
                day = p // self._scheduler.periods_per_day
                period = p % self._scheduler.periods_per_day + 1
                
                solution["periods"].append({
                    "day": day,
                    "period_no": period,
                    "room_id": self._scheduler.rooms[r].id,
                    "batch_id": self._scheduler.batches[b].id,
                    "subject_id": self._scheduler.subjects[s].id,
                    "faculty_id": self._scheduler.faculty[f].id,
                })
        
        return solution
    
    def get_solutions(self):
        """Return all collected solutions"""
        return self._solutions
