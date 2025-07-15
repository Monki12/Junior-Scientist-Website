
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Task, Board, UserProfileData, Subtask, TaskStatus, TaskPriority, BoardMember } from '@/types';
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
import { Loader2, Trash2, PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '../ui/card';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  board: Board | null;
  boardMembers: BoardMember[];
  allUsers: UserProfileData[];
  canManage: boolean;
  onTaskUpdate: (task: Task) => void;
}

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
    
    if (!task && !formState.caption?.trim()) {
        toast({ title: "Caption is required", description: "Please enter a short title for the task.", variant: "destructive" });
        return;
    }
    
    setIsUpdating(true);

    const dataToSave: Task = {
      ...(task || {}), // Start with existing task data or empty object
      ...formState,    // Overlay form state
      id: task?.id || nanoid(), // Use existing ID or generate one
      boardId: board.id,
      dueDate: formState.dueDate ? (formState.dueDate as Date).toISOString() : null,
      updatedAt: new Date().toISOString(),
      createdAt: task?.createdAt || new Date().toISOString(),
      title: formState.caption || 'Untitled Task', // Ensure title exists
    } as Task;
    
    onTaskUpdate(dataToSave);
    // The parent component will handle closing the modal and showing toast
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
    return allUsers.find(u => u.uid === formState.assignedToUserIds![0]);
  }, [formState.assignedToUserIds, allUsers]);

  if (!isOpen) return null;

  return (
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
                          <Button variant="outline" className={`w-full justify-start text-left font-normal ${!formState.dueDate && "text-muted-foreground"}`} disabled={!canManage && !!task}>
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
                <h4 className="font-semibold mb-2">Assigned To</h4>
                 <div className="space-y-2">
                     {assignedUser ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8"><AvatarImage src={assignedUser.photoURL || undefined} /><AvatarFallback>{(assignedUser.fullName||'U')[0]}</AvatarFallback></Avatar>
                            <span>{assignedUser.fullName}</span>
                        </div>
                     ) : (
                        <p className="text-sm text-muted-foreground">Unassigned (In "New Tasks")</p>
                     )}
                     {canManage && (
                        <Select
                            onValueChange={(uid) => {
                                const newAssignedIds = uid === 'unassigned' ? [] : [uid];
                                handleInputChange('assignedToUserIds', newAssignedIds);
                            }}
                            value={formState.assignedToUserIds?.[0] || 'unassigned'}
                        >
                            <SelectTrigger><SelectValue placeholder="Assign to..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {boardMembers.map(member => (
                                    <SelectItem key={member.userId} value={member.userId}>{member.name}</SelectItem>
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
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
