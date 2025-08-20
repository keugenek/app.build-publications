import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Member, Class } from '../../../../server/src/schema';

export function AdminStats() {
  const [members, setMembers] = useState<Member[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [membersResult, classesResult] = await Promise.all([
        trpc.getMembers.query(),
        trpc.getClasses.query()
      ]);
      setMembers(membersResult);
      setClasses(classesResult);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Calculate statistics
  const activeMembers = members.filter(m => m.status === 'active').length;
  const premiumMembers = members.filter(m => m.membership_type === 'premium').length;
  const vipMembers = members.filter(m => m.membership_type === 'vip').length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingClasses = classes.filter(c => 
    c.status === 'scheduled' && new Date(c.class_date) >= today
  ).length;
  
  const totalCapacity = classes.reduce((sum, c) => sum + c.max_capacity, 0);
  const totalBookings = classes.reduce((sum, c) => sum + c.current_bookings, 0);
  const utilizationRate = totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0;

  // Get member distribution by type
  const membersByType = {
    basic: members.filter(m => m.membership_type === 'basic').length,
    premium: premiumMembers,
    vip: vipMembers
  };

  const recentMembers = members
    .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Members</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{members.length}</div>
            <p className="text-xs text-green-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {activeMembers} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Upcoming Classes</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{upcomingClasses}</div>
            <p className="text-xs text-slate-400 mt-1">
              {classes.length} total classes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Utilization Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{utilizationRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-400 mt-1">
              {totalBookings}/{totalCapacity} spots booked
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Premium Members</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{premiumMembers + vipMembers}</div>
            <p className="text-xs text-slate-400 mt-1">
              {((premiumMembers + vipMembers) / members.length * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Member Distribution and Recent Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Distribution */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="h-5 w-5 mr-2 text-orange-500" />
              Membership Distribution
            </CardTitle>
            <CardDescription className="text-slate-400">
              Breakdown by membership type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-white">Basic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">{membersByType.basic}</span>
                  <Badge className="bg-blue-600">
                    {members.length > 0 ? (membersByType.basic / members.length * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-white">Premium</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">{membersByType.premium}</span>
                  <Badge className="bg-purple-600">
                    {members.length > 0 ? (membersByType.premium / members.length * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-white">VIP</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">{membersByType.vip}</span>
                  <Badge className="bg-yellow-600">
                    {members.length > 0 ? (membersByType.vip / members.length * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              Recent Members
            </CardTitle>
            <CardDescription className="text-slate-400">
              Latest member registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No members yet</p>
            ) : (
              <div className="space-y-3">
                {recentMembers.map((member: Member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">
                        {member.first_name} {member.last_name}
                      </h4>
                      <p className="text-slate-400 text-sm">{member.email}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className={
                        member.membership_type === 'vip' ? 'bg-yellow-600' :
                        member.membership_type === 'premium' ? 'bg-purple-600' : 'bg-blue-600'
                      }>
                        {member.membership_type}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {member.joined_at.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Stats Summary</CardTitle>
          <CardDescription className="text-slate-400">
            Key performance indicators at a glance 🎯
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {members.filter(m => m.status === 'active').length}
              </div>
              <div className="text-sm text-slate-400">Active Members</div>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {classes.filter(c => c.status === 'scheduled').length}
              </div>
              <div className="text-sm text-slate-400">Scheduled Classes</div>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">
                {classes.filter(c => c.current_bookings === c.max_capacity).length}
              </div>
              <div className="text-sm text-slate-400">Full Classes</div>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {Math.round(utilizationRate)}%
              </div>
              <div className="text-sm text-slate-400">Avg Utilization</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
