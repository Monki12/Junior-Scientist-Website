
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Task, Board, UserProfileData, Subtask, TaskStatus, TaskPriority } from '@/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { format, parseISO } from 'date-fns';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trash2, PlusCircle, UserPlus, Calendar as CalendarIcon } from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  board: Board | null;
  boardMembers: UserProfileData[];
  allUsers: UserProfileData[];
  canManage: boolean;
}

export default function TaskDetailModal({ isOpen, onClose, task, board, boardMembers, allUsers, canManage }: TaskDetailModalProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formState, setFormState] = useState<Partial<Task>>({});
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    if (task) {
      setFormState({
        ...task,
        dueDate: task.dueDate ? parseISO(task.dueDate) : null,
      });
    } else {
      // If creating a new task, set defaults
      setFormState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Not Started',
        assignedToUserIds: [],
        subtasks: [],
      });
    }
  }, [task, isOpen]);

  const handleInputChange = (field: keyof Task, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveChanges = async () => {
    if (!task || !formState) return;
    setIsUpdating(true);
    try {
        const taskRef = doc(db, 'tasks', task.id);
        const dataToUpdate = {
            ...formState,
            dueDate: formState.dueDate ? (formState.dueDate as Date).toISOString() : null,
            updatedAt: serverTimestamp(),
        }
        await updateDoc(taskRef, dataToUpdate);
        toast({ title: "Task Updated" });
        onClose();
    } catch(e) {
        toast({ title: "Update Failed", variant: "destructive"});
    } finally {
        setIsUpdating(false);
    }
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

  const assignedUsers = useMemo(() => {
    return allUsers.filter(u => formState.assignedToUserIds?.includes(u.uid));
  }, [formState.assignedToUserIds, allUsers]);

  if (!isOpen || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{formState.title || 'New Task'}</DialogTitle>
          <DialogDescription>In board: {board?.name}</DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-3 gap-6 py-4 flex-1 overflow-y-auto pr-4">
          {/* Left/Main Column */}
          <div className="md:col-span-2 space-y-6">
            <div>
                <Label htmlFor="taskTitle">Title</Label>
                <Input id="taskTitle" value={formState.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} disabled={!canManage} />
            </div>
             <div>
                <Label htmlFor="taskDesc">Description</Label>
                <Textarea id="taskDesc" value={formState.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} rows={5} />
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
            {/* Attachments and Comments placeholder */}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
              <Card className="p-4">
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
                        <Select value={formState.priority} onValueChange={v => handleInputChange('priority', v as TaskPriority)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Due Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                          <Button variant="outline" className={`w-full justify-start text-left font-normal ${!formState.dueDate && "text-muted-foreground"}`}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formState.dueDate ? format(formState.dueDate as Date, "PPP") : <span>Pick a due date</span>}
                          </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formState.dueDate as Date} onSelect={date => handleInputChange('dueDate', date)} initialFocus /></PopoverContent>
                      </Popover>
                    </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2">People</h4>
                 <div className="space-y-2">
                    <Label>Assigned To</Label>
                     {assignedUsers.length > 0 ? (
                        <div className="space-y-2">
                            {assignedUsers.map(user => (
                                <div key={user.uid} className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8"><AvatarImage src={user.photoURL || undefined} /><AvatarFallback>{(user.fullName||'U')[0]}</AvatarFallback></Avatar>
                                    <span>{user.fullName}</span>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <p className="text-sm text-muted-foreground">Not assigned</p>
                     )}
                     {canManage && (
                        <Select onValueChange={(uid) => handleInputChange('assignedToUserIds', uid ? [uid] : [])}>
                            <SelectTrigger><SelectValue placeholder="Assign to..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Unassigned</SelectItem>
                                {boardMembers.map(member => (
                                    <SelectItem key={member.uid} value={member.uid}>{member.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     )}
                 </div>
              </Card>
          </div>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
