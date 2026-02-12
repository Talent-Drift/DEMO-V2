"""
Simple Sample Data Generator
"""

import pandas as pd
import random
from datetime import datetime, timedelta

# Simple data
recruiters = ['Sarah Chen', 'Michael Rodriguez', 'Emily Watson', 'David Kim']
hiring_managers = ['Jennifer Smith', 'James Anderson', 'Lisa Taylor', 'William Davis']
teams = ['Engineering', 'Product', 'Sales', 'Marketing']
stages = ['Phone Screen', 'Technical Interview', 'Onsite Interview', 'Offer']

jobs = {
    'Engineering': ['Software Engineer', 'Senior Engineer'],
    'Product': ['Product Manager', 'Product Designer'],
    'Sales': ['Account Executive', 'Sales Development Rep'],
    'Marketing': ['Marketing Manager', 'Content Writer']
}

# Generate 50 simple records
records = []
for i in range(50):
    team = random.choice(teams)
    records.append({
        'requisition_id': f'REQ-{2025000 + i // 3}',
        'candidate_id': f'CAND-{100001 + i}',
        'recruiter_name': random.choice(recruiters),
        'hiring_manager_name': random.choice(hiring_managers),
        'current_stage': random.choice(stages),
        'stage_start_date': (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
        'interview_date': (datetime.now() - timedelta(days=random.randint(1, 10))).strftime('%Y-%m-%d'),
        'feedback_date': (datetime.now() - timedelta(days=random.randint(0, 5))).strftime('%Y-%m-%d'),
        'team': team,
        'job_title': random.choice(jobs[team]),
        'role_opened_date': (datetime.now() - timedelta(days=random.randint(10, 60))).strftime('%Y-%m-%d'),
        'current_status': 'In Progress'
    })

# Save
df = pd.DataFrame(records)
df.to_csv('sample_ats_export.csv', index=False)
print(f"✅ Created {len(df)} records in sample_ats_export.csv")
