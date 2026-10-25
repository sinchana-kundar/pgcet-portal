"""Initial schema migration for PGCET portal

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='student'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('pdf_url', sa.String(length=500), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_published_at'), 'notifications', ['published_at'], unique=False)

    # 3. Study Materials
    op.create_table(
        'study_materials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject', sa.String(length=100), nullable=False),
        sa.Column('topic', sa.String(length=150), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_study_materials_id'), 'study_materials', ['id'], unique=False)
    op.create_index(op.f('ix_study_materials_subject'), 'study_materials', ['subject'], unique=False)
    op.create_index(op.f('ix_study_materials_topic'), 'study_materials', ['topic'], unique=False)
    op.create_index(op.f('ix_study_materials_uploaded_at'), 'study_materials', ['uploaded_at'], unique=False)

    # 4. Downloads
    op.create_table(
        'downloads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_downloads_id'), 'downloads', ['id'], unique=False)
    op.create_index(op.f('ix_downloads_category'), 'downloads', ['category'], unique=False)

    # 5. Questions
    op.create_table(
        'questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject', sa.String(length=100), nullable=False),
        sa.Column('topic', sa.String(length=150), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('option_a', sa.Text(), nullable=False),
        sa.Column('option_b', sa.Text(), nullable=False),
        sa.Column('option_c', sa.Text(), nullable=False),
        sa.Column('option_d', sa.Text(), nullable=False),
        sa.Column('correct_option', sa.String(length=1), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('difficulty', sa.String(length=20), server_default='medium', nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_questions_id'), 'questions', ['id'], unique=False)
    op.create_index(op.f('ix_questions_subject'), 'questions', ['subject'], unique=False)
    op.create_index(op.f('ix_questions_topic'), 'questions', ['topic'], unique=False)
    op.create_index(op.f('ix_questions_difficulty'), 'questions', ['difficulty'], unique=False)

    # 6. Mock Tests
    op.create_table(
        'mock_tests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=100), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), server_default='60', nullable=False),
        sa.Column('total_questions', sa.Integer(), server_default='0', nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mock_tests_id'), 'mock_tests', ['id'], unique=False)
    op.create_index(op.f('ix_mock_tests_subject'), 'mock_tests', ['subject'], unique=False)

    # 7. Mock Test Questions (Association Table)
    op.create_table(
        'mock_test_questions',
        sa.Column('mock_test_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['mock_test_id'], ['mock_tests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('mock_test_id', 'question_id')
    )

    # 8. Attempts
    op.create_table(
        'attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('mock_test_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['mock_test_id'], ['mock_tests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attempts_id'), 'attempts', ['id'], unique=False)
    op.create_index(op.f('ix_attempts_user_id'), 'attempts', ['user_id'], unique=False)
    op.create_index(op.f('ix_attempts_mock_test_id'), 'attempts', ['mock_test_id'], unique=False)

    # 9. Attempt Answers
    op.create_table(
        'attempt_answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('attempt_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('selected_option', sa.String(length=1), nullable=True),
        sa.Column('is_correct', sa.Boolean(), server_default='0', nullable=False),
        sa.ForeignKeyConstraint(['attempt_id'], ['attempts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attempt_answers_id'), 'attempt_answers', ['id'], unique=False)
    op.create_index(op.f('ix_attempt_answers_attempt_id'), 'attempt_answers', ['attempt_id'], unique=False)
    op.create_index(op.f('ix_attempt_answers_question_id'), 'attempt_answers', ['question_id'], unique=False)

    # 10. Results
    op.create_table(
        'results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reg_number', sa.String(length=50), nullable=False),
        sa.Column('dob', sa.Date(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('marks', sa.Float(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_results_id'), 'results', ['id'], unique=False)
    op.create_index(op.f('ix_results_reg_number'), 'results', ['reg_number'], unique=True)
    op.create_index(op.f('ix_results_dob'), 'results', ['dob'], unique=False)
    op.create_index(op.f('ix_results_rank'), 'results', ['rank'], unique=False)


def downgrade() -> None:
    op.drop_table('results')
    op.drop_table('attempt_answers')
    op.drop_table('attempts')
    op.drop_table('mock_test_questions')
    op.drop_table('mock_tests')
    op.drop_table('questions')
    op.drop_table('downloads')
    op.drop_table('study_materials')
    op.drop_table('notifications')
    op.drop_table('users')
