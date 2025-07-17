

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Task, Board, UserProfileData, Subtask, TaskStatus, TaskPriority, BoardMember, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { format, parseISO, isValid } from 'date-fns';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trash2, PlusCircle, Calendar as CalendarIcon, Search, ArrowLeft } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  board: Board | null;
  boardMembers: BoardMember[];
  allUsers: UserProfileData[];
  canManage: boolean;
  onTaskUpdate: (task: Partial<Task>, isNew: boolean) => void;
}

const AssigneeSelector = ({ boardMembers, onSelect, disabled }: { boardMembers: BoardMember[], onSelect: (userId: string) => void, disabled: boolean }) => {
    const [view, setView] = useState<'roles' | 'users'>('roles');
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const ROLES: { name: string, role: UserRole }[] = [
        { name: 'Admins', role: 'admin' },
        { name: 'Overall Heads', role: 'overall_head' },
        { name: 'Event Representatives', role: 'event_representative' },
        { name: 'Organisers', role: 'organizer' },
    ];

    const handleRoleSelect = (role: UserRole) => {
        setSelectedRole(role);
        setView('users');
    };

    const handleUserSelect = (userId: string) => {
        onSelect(userId);
    };

    const filteredUsers = useMemo(() => {
        let users = boardMembers;
        if (view === 'users' && selectedRole) {
            users = users.filter(u => u.role === selectedRole);
        }
        if (searchTerm) {
            users = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return users;
    }, [view, selectedRole, searchTerm, boardMembers]);

    useEffect(() => {
        if(!disabled) {
            setView('roles');
            setSelectedRole(null);
            setSearchTerm('');
        }
    }, [disabled]);
    

    return (
        <div className='space-y-2'>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setView('users'); // Switch to user view on search
                        setSelectedRole(null);
                    }}
                    className="pl-9"
                    disabled={disabled}
                />
            </div>
             {view === 'users' && (
                <Button variant="ghost" size="sm" onClick={() => { setView('roles'); setSelectedRole(null); setSearchTerm(''); }}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roles
                </Button>
            )}
            <ScrollArea className="h-40 rounded-md border p-2">
                {view === 'roles' && !searchTerm ? (
                    ROLES.map(roleInfo => (
                         <div key={roleInfo.role} onClick={() => handleRoleSelect(roleInfo.role)} className="p-2 rounded-md hover:bg-accent cursor-pointer">
                           {roleInfo.name}
                        </div>
                    ))
                ) : (
                    filteredUsers.map(member => (
                        <div key={member.userId} onClick={() => handleUserSelect(member.userId)} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member.photoURL || undefined} />
                                <AvatarFallback>{(member.name||'U')[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{member.role.replace(/_/g, ' ')}</p>
                            </div>
                        </div>
                    ))
                )}
            </ScrollArea>
        </div>
    )
};


export default function TaskDetailModal({ isOpen, onClose, task, board, boardMembers, allUsers, canManage, onTaskUpdate }: TaskDetailModalProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formState, setFormState] = useState<Partial<Task>>({});
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormState({
          ...task,
          dueDate: task.dueDate && isValid(parseISO(task.dueDate)) ? parseISO(task.dueDate) : null,
        });
      } else {
        // Defaults for a new task
        setFormState({
          id: undefined, // Explicitly undefined for new tasks
          title: '',
          caption: '',
          description: '',
          priority: 'Medium',
          status: 'Not Started',
          assignedToUserIds: [],
          subtasks: [],
          bucket: 'other',
          dueDate: null,
        });
      }
    }
  }, [task, isOpen]);

  const handleInputChange = (field: keyof Task, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveChanges = async () => {
    if (!board) return;
    setIsUpdating(true);

    const isNewTask = !formState.id;

    if (canManage && !formState.caption?.trim()) {
        toast({ title: "Caption is required", description: "Please enter a short title for the task.", variant: "destructive" });
        setIsUpdating(false);
        return;
    }

    const dataToSave: Partial<Task> = {
        ...formState,
        dueDate: formState.dueDate ? (formState.dueDate as Date).toISOString() : null,
        title: formState.caption || 'Untitled Task',
    };
    
    // For non-managers, only allow updating status and subtasks
    if (!canManage) {
        const minimalUpdate: Partial<Task> = {
            id: formState.id,
            status: formState.status,
            subtasks: formState.subtasks,
            assignedToUserIds: formState.assignedToUserIds,
        };
        onTaskUpdate(minimalUpdate, isNewTask);
    } else {
        onTaskUpdate(dataToSave, isNewTask);
    }
    
    setIsUpdating(false);
  };

  const handleSubtaskChange = (index: number, field: 'text' | 'completed', value: string | boolean) => {
    const newSubtasks = [...(formState.subtasks || [])];
    (newSubtasks[index] as any)[field] = value;
    handleInputChange('subtasks', newSubtasks);
  };
  
  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSubtask: Subtask = { id: nanoid(), text: newSubtaskText, completed: false };
    const newSubtasks = [...(formState.subtasks || []), newSubtask];
    handleInputChange('subtasks', newSubtasks);
    setNewSubtaskText('');
  };
  
  const handleRemoveSubtask = (index: number) => {
    const newSubtasks = (formState.subtasks || []).filter((_, i) => i !== index);
    handleInputChange('subtasks', newSubtasks);
  }

  const assignedUser = useMemo(() => {
      if (!formState.assignedToUserIds || formState.assignedToUserIds.length === 0) return null;
      // Search in board members first for efficiency
      const member = boardMembers.find(m => m.userId === formState.assignedToUserIds![0]);
      if (member) return { uid: member.userId, fullName: member.name, photoURL: member.photoURL };
      // Fallback to all users if not found in board members (less likely but safe)
      return allUsers.find(u => u.uid === formState.assignedToUserIds![0]);
  }, [formState.assignedToUserIds, allUsers, boardMembers]);


  if (!isOpen) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>Board: {board?.name}</DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-3 gap-6 py-4 flex-1 overflow-y-auto pr-4">
          <div className="md:col-span-2 space-y-6">
            <div>
                <Label htmlFor="taskCaption">Caption (Short Title)</Label>
                <Input id="taskCaption" value={formState.caption || ''} onChange={(e) => handleInputChange('caption', e.target.value)} disabled={!canManage && !!task} />
            </div>
             <div>
                <Label htmlFor="taskDesc">Detailed Task Description</Label>
                <Textarea id="taskDesc" value={formState.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows={5} disabled={!canManage && !!task} />
            </div>

            <div>
                <Label>Subtasks</Label>
                <div className="space-y-2 mt-1">
                    {(formState.subtasks || []).map((subtask, index) => (
                        <div key={subtask.id} className="flex items-center gap-2">
                            <Checkbox checked={subtask.completed} onCheckedChange={(checked) => handleSubtaskChange(index, 'completed', !!checked)} />
                            <Input value={subtask.text} className="h-8" onChange={(e) => handleSubtaskChange(index, 'text', e.target.value)} />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveSubtask(index)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <Input placeholder="Add a new subtask..." value={newSubtaskText} onChange={(e) => setNewSubtaskText(e.target.value)} />
                        <Button onClick={handleAddSubtask}><PlusCircle className="h-4 w-4 mr-2"/>Add</Button>
                    </div>
                </div>
            </div>
          </div>

          <div className="space-y-6">
              <Card className="p-4 bg-muted/50">
                <h4 className="font-semibold mb-2">Details</h4>
                <div className="space-y-4">
                    <div>
                        <Label>Status</Label>
                        <Select value={formState.status} onValueChange={v => handleInputChange('status', v as TaskStatus)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Not Started">Not Started</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Pending Review">Pending Review</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label>Priority</Label>
                        <Select value={formState.priority} onValueChange={v => handleInputChange('priority', v as TaskPriority)} disabled={!canManage && !!task}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Deadline</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formState.dueDate && "text-muted-foreground")} disabled={!canManage && !!task}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formState.dueDate ? format(formState.dueDate as Date, "PPP") : <span>Pick a deadline</span>}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formState.dueDate as Date} onSelect={date => handleInputChange('dueDate', date)} initialFocus /></PopoverContent>
                      </Popover>
                    </div>
                    <div>
                        <Label>Bucket</Label>
                        <RadioGroup defaultValue={formState.bucket || 'other'} onValueChange={(val) => handleInputChange('bucket', val)} className="flex space-x-2" disabled={!canManage && !!task}>
                           <div className="flex items-center space-x-1"><RadioGroupItem value="a" id="r-a" /><Label htmlFor="r-a">A</Label></div>
                           <div className="flex items-center space-x-1"><RadioGroupItem value="b" id="r-b" /><Label htmlFor="r-b">B</Label></div>
                           <div className="flex items-center space-x-1"><RadioGroupItem value="c" id="r-c" /><Label htmlFor="r-c">C</Label></div>
                           <div className="flex items-center space-x-1"><RadioGroupItem value="other" id="r-other" /><Label htmlFor="r-other">Other</Label></div>
                        </RadioGroup>
                    </div>
                </div>
              </Card>

              <Card className="p-4 bg-muted/50">
                <Popover>
                  <PopoverTrigger asChild>
                      <button className="w-full text-left" disabled={!canManage && !!task}>
                        <h4 className="font-semibold mb-2">Assigned To</h4>
                          {assignedUser ? (
                              <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
                                  <Avatar className="h-8 w-8"><AvatarImage src={assignedUser.photoURL || undefined} /><AvatarFallback>{(assignedUser.fullName||'U')[0]}</AvatarFallback></Avatar>
                                  <span>{assignedUser.fullName}</span>
                              </div>
                          ) : (
                              <div className="p-2 border border-dashed rounded-md text-muted-foreground">
                                  Unassigned
                              </div>
                          )}
                      </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <AssigneeSelector 
                        boardMembers={boardMembers} 
                        onSelect={(userId) => {
                           handleInputChange('assignedToUserIds', [userId]);
                        }}
                        disabled={!canManage && !!task}
                    />
                  </PopoverContent>
                </Popover>
              </Card>
          </div>
        </div>
        <DialogFooter className="pt-4 border-t flex justify-end">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSaveChanges} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
