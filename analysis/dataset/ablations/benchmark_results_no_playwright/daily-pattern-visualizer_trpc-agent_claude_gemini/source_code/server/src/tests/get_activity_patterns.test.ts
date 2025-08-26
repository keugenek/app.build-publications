import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityLogsTable } from '../db/schema';
import { getActivityPatterns } from '../handlers/get_activity_patterns';

describe('getActivityPatterns', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testUserId = 'test-user-123';
  const otherUserId = 'other-user-456';

  it('should return default pattern for user with no activity logs', async () => {
    const result = await getActivityPatterns(testUserId);

    expect(result.user_id).toEqual(testUserId);
    expect(result.average_sleep).toEqual(0);
    expect(result.average_work).toEqual(0);
    expect(result.average_social).toEqual(0);
    expect(result.average_screen).toEqual(0);
    expect(result.average_energy).toEqual(0);
    expect(result.total_days).toEqual(0);
    expect(result.optimal_work_time).toBeNull();
    expect(result.break_suggestions).toContain('Start tracking your daily activities to get personalized insights');
    expect(result.break_suggestions).toContain('Log at least 7 days of data for meaningful patterns');
  });

  it('should calculate correct averages from activity logs', async () => {
    // Create test activity logs with known values
    await db.insert(activityLogsTable)
      .values([
        {
          user_id: testUserId,
          date: '2024-01-01',
          sleep_hours: '8.00',
          work_hours: '8.00',
          social_hours: '2.00',
          screen_hours: '6.00',
          emotional_energy: 8,
          notes: 'Good day'
        },
        {
          user_id: testUserId,
          date: '2024-01-02',
          sleep_hours: '7.00',
          work_hours: '9.00',
          social_hours: '1.50',
          screen_hours: '7.00',
          emotional_energy: 6,
          notes: 'Busy day'
        },
        {
          user_id: testUserId,
          date: '2024-01-03',
          sleep_hours: '6.50',
          work_hours: '10.00',
          social_hours: '3.00',
          screen_hours: '8.00',
          emotional_energy: 4,
          notes: 'Tired day'
        }
      ])
      .execute();

    const result = await getActivityPatterns(testUserId);

    expect(result.user_id).toEqual(testUserId);
    expect(result.total_days).toEqual(3);
    expect(result.average_sleep).toBeCloseTo(7.17, 1); // (8 + 7 + 6.5) / 3
    expect(result.average_work).toEqual(9); // (8 + 9 + 10) / 3
    expect(result.average_social).toBeCloseTo(2.17, 1); // (2 + 1.5 + 3) / 3
    expect(result.average_screen).toEqual(7); // (6 + 7 + 8) / 3
    expect(result.average_energy).toEqual(6); // (8 + 6 + 4) / 3
  });

  it('should only analyze logs for the specified user', async () => {
    // Create logs for different users
    await db.insert(activityLogsTable)
      .values([
        {
          user_id: testUserId,
          date: '2024-01-01',
          sleep_hours: '8.00',
          work_hours: '8.00',
          social_hours: '2.00',
          screen_hours: '6.00',
          emotional_energy: 8,
          notes: 'Test user data'
        },
        {
          user_id: otherUserId,
          date: '2024-01-01',
          sleep_hours: '4.00',
          work_hours: '12.00',
          social_hours: '0.50',
          screen_hours: '10.00',
          emotional_energy: 2,
          notes: 'Other user data'
        }
      ])
      .execute();

    const result = await getActivityPatterns(testUserId);

    expect(result.user_id).toEqual(testUserId);
    expect(result.total_days).toEqual(1);
    expect(result.average_sleep).toEqual(8);
    expect(result.average_work).toEqual(8);
    expect(result.average_energy).toEqual(8);
  });

  it('should suggest optimal work time based on energy levels', async () => {
    // Test high energy scenario
    await db.insert(activityLogsTable)
      .values([
        {
          user_id: testUserId,
          date: '2024-01-01',
          sleep_hours: '8.00',
          work_hours: '8.00',
          social_hours: '2.00',
          screen_hours: '6.00',
          emotional_energy: 9,
          notes: null
        },
        {
          user_id: testUserId,
          date: '2024-01-02',
          sleep_hours: '8.00',
          work_hours: '8.00',
          social_hours: '2.00',
          screen_hours: '6.00',
          emotional_energy: 8,
          notes: null
        }
      ])
      .execute();

    const highEnergyResult = await getActivityPatterns(testUserId);
    expect(highEnergyResult.optimal_work_time).toEqual('9:00 AM - 12:00 PM');

    // Clear data and test medium energy scenario
    await db.delete(activityLogsTable).execute();

    await db.insert(activityLogsTable)
      .values([
        {
          user_id: testUserId,
          date: '2024-01-01',
          sleep_hours: '7.00',
          work_hours: '8.00',
          social_hours: '2.00',
          screen_hours: '6.00',
          emotional_energy: 6,
          notes: null
        },
        {
          user_id: testUserId,
          date: '2024-01-02',
          sleep_hours: '7.00',
          work_hours: '8.00',
          social_hours: '2.00',
          screen_hours: '6.00',
          emotional_energy: 5,
          notes: null
        }
      ])
      .execute();

    const mediumEnergyResult = await getActivityPatterns(testUserId);
    expect(mediumEnergyResult.optimal_work_time).toEqual('10:00 AM - 1:00 PM');
  });

  it('should generate relevant break suggestions based on activity patterns', async () => {
    // Test high work hours scenario
    await db.insert(activityLogsTable)
      .values([
        {
          user_id: testUserId,
          date: '2024-01-01',
          sleep_hours: '6.00',
          work_hours: '12.00',
          social_hours: '0.50',
          screen_hours: '10.00',
          emotional_energy: 3,
          notes: null
        }
      ])
      .execute();

    const result = await getActivityPatterns(testUserId);
    
    expect(result.break_suggestions).toContain('Your work hours are quite high - ensure you\'re taking adequate rest');
    expect(result.break_suggestions).toContain('Try to reduce screen time to improve eye health and sleep quality');
    expect(result.break_suggestions).toContain('Aim for 7-9 hours of sleep per night for optimal energy levels');
    expect(result.break_suggestions).toContain('Consider scheduling more social activities to improve work-life balance');
    expect(result.break_suggestions).toContain('Focus on activities that boost your energy: exercise, better sleep, or stress management');
  });

  it('should provide positive suggestions for balanced patterns', async () => {
    await db.insert(activityLogsTable)
      .values([
        {
          user_id: testUserId,
          date: '2024-01-01',
          sleep_hours: '8.00',
          work_hours: '7.50',
          social_hours: '2.00',
          screen_hours: '5.00',
          emotional_energy: 7,
          notes: 'Balanced day'
        }
      ])
      .execute();

    const result = await getActivityPatterns(testUserId);
    
    expect(result.break_suggestions).toContain('Your activity patterns look balanced - keep up the good work!');
    expect(result.break_suggestions).toContain('Continue tracking to identify long-term trends');
  });

  it('should handle numeric precision correctly', async () => {
    await db.insert(activityLogsTable)
      .values([
        {
          user_id: testUserId,
          date: '2024-01-01',
          sleep_hours: '7.33',
          work_hours: '8.75',
          social_hours: '1.67',
          screen_hours: '6.25',
          emotional_energy: 7,
          notes: null
        }
      ])
      .execute();

    const result = await getActivityPatterns(testUserId);

    expect(result.average_sleep).toEqual(7.33);
    expect(result.average_work).toEqual(8.75);
    expect(result.average_social).toEqual(1.67);
    expect(result.average_screen).toEqual(6.25);
    expect(result.average_energy).toEqual(7);
  });

  it('should suggest screen time reduction when it affects sleep', async () => {
    await db.insert(activityLogsTable)
      .values([
        {
          user_id: testUserId,
          date: '2024-01-01',
          sleep_hours: '5.50',
          work_hours: '8.00',
          social_hours: '2.00',
          screen_hours: '9.00',
          emotional_energy: 5,
          notes: null
        }
      ])
      .execute();

    const result = await getActivityPatterns(testUserId);
    
    expect(result.break_suggestions).toContain('High screen time may be affecting your sleep - consider a digital detox before bed');
  });

  it('should provide encouragement for good sleep habits', async () => {
    await db.insert(activityLogsTable)
      .values([
        {
          user_id: testUserId,
          date: '2024-01-01',
          sleep_hours: '9.50',
          work_hours: '7.00',
          social_hours: '3.00',
          screen_hours: '4.00',
          emotional_energy: 8,
          notes: null
        }
      ])
      .execute();

    const result = await getActivityPatterns(testUserId);
    
    expect(result.break_suggestions).toContain('You\'re getting plenty of sleep - great for maintaining high energy!');
  });
});
