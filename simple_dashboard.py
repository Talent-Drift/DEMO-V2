"""
Simple Recruiter Scorecard Dashboard
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime

# Page config
st.set_page_config(page_title="Recruiter Scorecard", page_icon="📊", layout="wide")

# Simple scoring function
def calculate_score(violations):
    """Start at 100, subtract penalties"""
    return max(0, 100 - (violations * 5))

# Load data
@st.cache_data
def load_data():
    try:
        df = pd.read_csv('sample_ats_export.csv')
        
        # Calculate simple violation count per person
        recruiter_violations = df.groupby('recruiter_name').size().reset_index(name='violations')
        recruiter_violations['score'] = recruiter_violations['violations'].apply(calculate_score)
        
        hm_violations = df.groupby('hiring_manager_name').size().reset_index(name='violations')
        hm_violations['score'] = hm_violations['violations'].apply(calculate_score)
        
        return df, recruiter_violations, hm_violations
    except FileNotFoundError:
        st.error("❌ Please upload sample_ats_export.csv")
        return None, None, None

# Main app
def main():
    st.title("📊 Recruiter Scorecard")
    st.caption("Simple performance tracking dashboard")
    
    df, recruiters, hms = load_data()
    
    if df is None:
        return
    
    # Navigation
    page = st.sidebar.radio("View", ["Overview", "Recruiters", "Hiring Managers"])
    
    if page == "Overview":
        st.header("📈 Overview")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Avg Recruiter Score", f"{recruiters['score'].mean():.0f}/100")
        
        with col2:
            st.metric("Avg Manager Score", f"{hms['score'].mean():.0f}/100")
        
        with col3:
            st.metric("Total Candidates", len(df))
        
        st.markdown("---")
        
        # Simple charts
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Recruiter Scores")
            fig = go.Figure(go.Bar(
                x=recruiters['score'],
                y=recruiters['recruiter_name'],
                orientation='h',
                marker_color='lightblue'
            ))
            fig.update_layout(height=400, showlegend=False)
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            st.subheader("Hiring Manager Scores")
            fig = go.Figure(go.Bar(
                x=hms['score'],
                y=hms['hiring_manager_name'],
                orientation='h',
                marker_color='lightgreen'
            ))
            fig.update_layout(height=400, showlegend=False)
            st.plotly_chart(fig, use_container_width=True)
    
    elif page == "Recruiters":
        st.header("👥 Recruiters")
        
        # Show table
        display_df = recruiters.copy()
        display_df.columns = ['Recruiter', 'Issues', 'Score']
        
        st.dataframe(
            display_df.sort_values('Score', ascending=False),
            use_container_width=True,
            hide_index=True
        )
        
        # Detail view
        selected = st.selectbox("View Details", recruiters['recruiter_name'].tolist())
        
        recruiter_data = df[df['recruiter_name'] == selected]
        score = recruiters[recruiters['recruiter_name'] == selected]['score'].iloc[0]
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Score", f"{score:.0f}/100")
        
        with col2:
            st.metric("Candidates", len(recruiter_data))
        
        with col3:
            st.metric("Roles", recruiter_data['requisition_id'].nunique())
        
        st.markdown("---")
        st.subheader("Recent Candidates")
        st.dataframe(
            recruiter_data[['candidate_id', 'job_title', 'current_stage', 'team']].head(10),
            use_container_width=True,
            hide_index=True
        )
    
    else:  # Hiring Managers
        st.header("🎯 Hiring Managers")
        
        # Show table
        display_df = hms.copy()
        display_df.columns = ['Hiring Manager', 'Issues', 'Score']
        
        st.dataframe(
            display_df.sort_values('Score', ascending=False),
            use_container_width=True,
            hide_index=True
        )
        
        # Detail view
        selected = st.selectbox("View Details", hms['hiring_manager_name'].tolist())
        
        hm_data = df[df['hiring_manager_name'] == selected]
        score = hms[hms['hiring_manager_name'] == selected]['score'].iloc[0]
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Score", f"{score:.0f}/100")
        
        with col2:
            st.metric("Candidates", len(hm_data))
        
        with col3:
            st.metric("Roles", hm_data['requisition_id'].nunique())
        
        st.markdown("---")
        st.subheader("Recent Candidates")
        st.dataframe(
            hm_data[['candidate_id', 'job_title', 'current_stage', 'team']].head(10),
            use_container_width=True,
            hide_index=True
        )

if __name__ == "__main__":
    main()
