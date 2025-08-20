import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Edit, Mail, Phone, Calendar, Filter, Users } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Member, CreateMemberInput, UpdateMemberInput } from '../../../../server/src/schema';

export function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [createForm, setCreateForm] = useState<CreateMemberInput>({
    email: '',
    first_name: '',
    last_name: '',
    phone: null,
    membership_type: 'basic',
    status: 'active'
  });

  const [updateForm, setUpdateForm] = useState<UpdateMemberInput>({
    id: 0,
    email: '',
    first_name: '',
    last_name: '',
    phone: null,
    membership_type: 'basic',
    status: 'active'
  });

  // Load members
  const loadMembers = useCallback(async () => {
    try {
      const result = await trpc.getMembers.query();
      setMembers(result);
      setFilteredMembers(result);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Filter members
  useEffect(() => {
    let filtered = members;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    // Filter by membership type
    if (membershipFilter !== 'all') {
      filtered = filtered.filter(m => m.membership_type === membershipFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.first_name.toLowerCase().includes(term) ||
        m.last_name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term)
      );
    }

    setFilteredMembers(filtered);
  }, [members, statusFilter, membershipFilter, searchTerm]);

  // Handle create member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const result = await trpc.createMember.mutate(createForm);
      setMembers((prev: Member[]) => [...prev, result]);
      
      // Reset form
      setCreateForm({
        email: '',
        first_name: '',
        last_name: '',
        phone: null,
        membership_type: 'basic',
        status: 'active'
      });
    } catch (error) {
      console.error('Failed to create member:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle update member
  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    
    setIsUpdating(editingMember.id);
    
    try {
      const result = await trpc.updateMember.mutate(updateForm);
      setMembers((prev: Member[]) => 
        prev.map(member => member.id === result.id ? result : member)
      );
      setEditingMember(null);
    } catch (error) {
      console.error('Failed to update member:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  // Open edit dialog
  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    setUpdateForm({
      id: member.id,
      email: member.email,
      first_name: member.first_name,
      last_name: member.last_name,
      phone: member.phone,
      membership_type: member.membership_type,
      status: member.status
    });
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case 'vip':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-purple-700';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600';
      case 'suspended':
        return 'bg-yellow-600';
      case 'inactive':
        return 'bg-gray-600';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Member */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-orange-500" />
            Add New Member
          </CardTitle>
          <CardDescription className="text-slate-400">
            Register a new gym member 💪
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-name" className="text-slate-300">First Name</Label>
                <Input
                  id="first-name"
                  value={createForm.first_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateMemberInput) => ({ ...prev, first_name: e.target.value }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="John"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="last-name" className="text-slate-300">Last Name</Label>
                <Input
                  id="last-name"
                  value={createForm.last_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateMemberInput) => ({ ...prev, last_name: e.target.value }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Doe"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateMemberInput) => ({ ...prev, email: e.target.value }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-slate-300">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={createForm.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: CreateMemberInput) => ({ ...prev, phone: e.target.value || null }))
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div>
                <Label htmlFor="membership-type" className="text-slate-300">Membership Type</Label>
                <Select 
                  value={createForm.membership_type} 
                  onValueChange={(value: 'basic' | 'premium' | 'vip') =>
                    setCreateForm((prev: CreateMemberInput) => ({ ...prev, membership_type: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status" className="text-slate-300">Status</Label>
                <Select 
                  value={createForm.status} 
                  onValueChange={(value: 'active' | 'inactive' | 'suspended') =>
                    setCreateForm((prev: CreateMemberInput) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isCreating}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isCreating ? 'Adding...' : 'Add Member'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-orange-500" />
                Members ({filteredMembers.length})
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage gym member accounts and settings
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-48 bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={membershipFilter} onValueChange={setMembershipFilter}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Members Table */}
          {filteredMembers.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              {members.length === 0 ? 'No members registered yet. Add your first member above! 👥' : 'No members match your filters.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-600">
                    <TableHead className="text-slate-300">Member</TableHead>
                    <TableHead className="text-slate-300">Contact</TableHead>
                    <TableHead className="text-slate-300">Membership</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Joined</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member: Member) => (
                    <TableRow key={member.id} className="border-slate-600">
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-sm text-slate-400">ID: {member.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-slate-300">
                            <Mail className="h-4 w-4 mr-2" />
                            <span className="text-sm">{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center text-slate-300">
                              <Phone className="h-4 w-4 mr-2" />
                              <span className="text-sm">{member.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMembershipColor(member.membership_type)}>
                          {member.membership_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-slate-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="text-sm">{member.joined_at.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => openEditDialog(member)}
                              variant="outline"
                              size="sm"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-800 border-slate-600 text-white">
                            <DialogHeader>
                              <DialogTitle>Edit Member</DialogTitle>
                              <DialogDescription className="text-slate-300">
                                Update member information and settings
                              </DialogDescription>
                            </DialogHeader>
                            
                            <form onSubmit={handleUpdateMember} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-slate-300">First Name</Label>
                                  <Input
                                    value={updateForm.first_name || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setUpdateForm(prev => ({ ...prev, first_name: e.target.value }))
                                    }
                                    className="bg-slate-700 border-slate-600 text-white"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label className="text-slate-300">Last Name</Label>
                                  <Input
                                    value={updateForm.last_name || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setUpdateForm(prev => ({ ...prev, last_name: e.target.value }))
                                    }
                                    className="bg-slate-700 border-slate-600 text-white"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label className="text-slate-300">Email</Label>
                                  <Input
                                    type="email"
                                    value={updateForm.email || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setUpdateForm(prev => ({ ...prev, email: e.target.value }))
                                    }
                                    className="bg-slate-700 border-slate-600 text-white"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label className="text-slate-300">Phone</Label>
                                  <Input
                                    value={updateForm.phone || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setUpdateForm(prev => ({ ...prev, phone: e.target.value || null }))
                                    }
                                    className="bg-slate-700 border-slate-600 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-slate-300">Membership Type</Label>
                                  <Select 
                                    value={updateForm.membership_type} 
                                    onValueChange={(value: 'basic' | 'premium' | 'vip') =>
                                      setUpdateForm(prev => ({ ...prev, membership_type: value }))
                                    }
                                  >
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-700 border-slate-600">
                                      <SelectItem value="basic">Basic</SelectItem>
                                      <SelectItem value="premium">Premium</SelectItem>
                                      <SelectItem value="vip">VIP</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-slate-300">Status</Label>
                                  <Select 
                                    value={updateForm.status} 
                                    onValueChange={(value: 'active' | 'inactive' | 'suspended') =>
                                      setUpdateForm(prev => ({ ...prev, status: value }))
                                    }
                                  >
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-700 border-slate-600">
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                      <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </form>
                            
                            <DialogFooter>
                              <Button
                                type="submit"
                                onClick={handleUpdateMember}
                                disabled={isUpdating === member.id}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                {isUpdating === member.id ? 'Updating...' : 'Update Member'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
