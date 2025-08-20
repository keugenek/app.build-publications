import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Users, Calendar, Plus, BarChart3 } from 'lucide-react';

// Import admin components
import { ClassManagement } from './admin/ClassManagement';
import { MemberManagement } from './admin/MemberManagement';
import { AttendanceTracking } from './admin/AttendanceTracking';
import { AdminStats } from './admin/AdminStats';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="h-6 w-6 mr-3 text-orange-500" />
            Admin Dashboard
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your gym operations and track performance 📊
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700 grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-600">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="classes" className="data-[state=active]:bg-orange-600">
            <Calendar className="h-4 w-4 mr-2" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-orange-600">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-orange-600">
            <Settings className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminStats />
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <ClassManagement />
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <MemberManagement />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <AttendanceTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
}
