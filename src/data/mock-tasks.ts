
import type { Task, Board, UserProfileData } from '@/types';

const MOCK_USERS: UserProfileData[] = [
    { uid: 'user1_admin', fullName: 'Alice Admin', email: 'alice@example.com', role: 'admin', credibilityScore: 150 },
    { uid: 'user2_overall_head', fullName: 'Bob Overall', email: 'bob@example.com', role: 'overall_head', credibilityScore: 120 },
    { uid: 'user3_organizer', fullName: 'Charlie Org', email: 'charlie@example.com', role: 'organizer', credibilityScore: 95 },
    { uid: 'user4_representative', fullName: 'Diana Rep', email: 'diana@example.com', role: 'event_representative', credibilityScore: 110 },
    { uid: 'user5_event_rep', fullName: 'Eve Event', email: 'eve@example.com', role: 'event_representative', credibilityScore: 80 },
    { uid: 'user6_team_member', fullName: 'Frank Team', email: 'frank@example.com', role: 'student', credibilityScore: 0 },
    { uid: 'user7_gala_coord', fullName: 'Grace Coordinator', email: 'grace@example.com', role: 'event_representative', credibilityScore: 100 },
    { uid: 'user8_art_team', fullName: 'Harry Art', email: 'harry@example.com', role: 'student', credibilityScore: 0 },
];

const MOCK_BOARDS: Board[] = [
    {
        id: 'general_board',
        name: "General",
        type: "general",
        memberUids: ["user1_admin", "user2_overall_head", "user3_organizer", "user4_representative"],
        members: [
            { userId: "user1_admin", role: "Admin", name: "Alice Admin" },
            { userId: "user2_overall_head", role: "Overall Head", name: "Bob Overall" },
            { userId: "user3_organizer", role: "Organizer", name: "Charlie Org" },
            { userId: "user4_representative", role: "Representative", name: "Diana Rep" }
        ],
        createdAt: new Date(),
        createdBy: 'system'
    },
    {
        id: 'event_science_fair',
        name: "Science Fair Event Board",
        type: "event",
        eventId: "science_fair_2025",
        memberUids: ["user1_admin", "user2_overall_head", "user5_event_rep", "user6_team_member"],
        members: [
            { userId: "user1_admin", role: "Admin", name: "Alice Admin" },
            { userId: "user2_overall_head", role: "Overall Head", name: "Bob Overall" },
            { userId: "user5_event_rep", role: "Event Representative", name: "Eve Event" },
            { userId: "user6_team_member", role: "Team Member", name: "Frank Team" }
        ],
        createdAt: new Date(),
        createdBy: 'system'
    },
    {
        id: 'event_art_gala',
        name: "Art Gala Event Board",
        type: "event",
        eventId: "art_gala_2025",
        memberUids: ["user1_admin", "user2_overall_head", "user7_gala_coord", "user8_art_team"],
        members: [
            { userId: "user1_admin", role: "Admin", name: "Alice Admin" },
            { userId: "user2_overall_head", role: "Overall Head", name: "Bob Overall" },
            { userId: "user7_gala_coord", role: "Event Representative", name: "Grace Coordinator" },
            { userId: "user8_art_team", role: "Team Member", name: "Harry Art" }
        ],
        createdAt: new Date(),
        createdBy: 'system'
    }
];

const MOCK_TASKS: Task[] = [
    {
        id: "task_1",
        boardId: "general_board",
        title: "Draft Project Proposal",
        description: "Draft the initial project proposal document, including scope, objectives, and key deliverables. Collaborate with department heads.",
        bucket: "a",
        caption: "Draft Project Proposal",
        dueDate: "2025-07-20T23:59:59Z",
        assignedToUserIds: [],
        status: "Not Started",
        priority: "High",
        createdAt: "2025-07-15T10:00:00Z",
        updatedAt: "2025-07-15T10:00:00Z",
        subtasks: []
    },
    {
        id: "task_2",
        boardId: "general_board",
        title: "Approve Q3 Budget",
        description: "Review and approve the final budget allocation for Q3. Ensure all departments have adequate funding.",
        bucket: "a",
        caption: "Approve Q3 Budget",
        dueDate: "2025-07-22T17:00:00Z",
        assignedToUserIds: ["user1_admin"],
        status: "In Progress",
        priority: "High",
        createdAt: "2025-07-15T11:00:00Z",
        updatedAt: "2025-07-15T11:00:00Z",
        subtasks: []
    },
    {
        id: "task_3",
        boardId: "general_board",
        title: "Lead Weekly Meeting",
        description: "Schedule and lead the weekly leadership meeting. Prepare agenda and minutes.",
        bucket: "b",
        caption: "Lead Weekly Meeting",
        dueDate: "2025-07-18T10:00:00Z",
        assignedToUserIds: ["user1_admin"],
        status: "Not Started",
        priority: "Medium",
        createdAt: "2025-07-15T12:00:00Z",
        updatedAt: "2025-07-15T12:00:00Z",
        subtasks: []
    },
    {
        id: "task_4",
        boardId: "general_board",
        title: "Vendor Coordination",
        description: "Coordinate with external vendors for event supplies. Get quotes and finalize contracts.",
        bucket: "a",
        caption: "Vendor Coordination",
        dueDate: "2025-07-25T18:00:00Z",
        assignedToUserIds: ["user2_overall_head"],
        status: "Not Started",
        priority: "High",
        createdAt: "2025-07-15T13:00:00Z",
        updatedAt: "2025-07-15T13:00:00Z",
        subtasks: []
    },
    {
        id: "task_5",
        boardId: "general_board",
        title: "Prepare Stakeholder Deck",
        description: "Prepare presentation slides for the upcoming stakeholder meeting. Focus on project milestones.",
        bucket: "c",
        caption: "Prepare Stakeholder Deck",
        dueDate: "2025-07-23T14:00:00Z",
        assignedToUserIds: ["user2_overall_head"],
        status: "In Progress",
        priority: "Medium",
        createdAt: "2025-07-15T14:00:00Z",
        updatedAt: "2025-07-15T14:00:00Z",
        subtasks: []
    },
    {
        id: "task_6",
        boardId: "general_board",
        title: "Team Building Event",
        description: "Organize team-building activity for the month. Research venues and activities.",
        bucket: "other",
        caption: "Team Building Event",
        dueDate: "2025-07-30T16:00:00Z",
        assignedToUserIds: ["user3_organizer"],
        status: "Not Started",
        priority: "Low",
        createdAt: "2025-07-15T15:00:00Z",
        updatedAt: "2025-07-15T15:00:00Z",
        subtasks: []
    },
    {
        id: "task_7",
        boardId: "general_board",
        title: "Member Onboarding Follow-up",
        description: "Follow up with all new members for onboarding completion.",
        bucket: "b",
        caption: "Member Onboarding Follow-up",
        dueDate: "2025-07-28T11:00:00Z",
        assignedToUserIds: ["user4_representative"],
        status: "Pending Review",
        priority: "Medium",
        createdAt: "2025-07-16T09:00:00Z",
        updatedAt: "2025-07-16T09:00:00Z",
        subtasks: []
    },
    {
        id: "task_8_science_fair",
        boardId: "event_science_fair",
        title: "Book Venue for Science Fair",
        description: "Finalize and book the main auditorium for the Science Fair.",
        bucket: "a",
        caption: "Book Venue",
        dueDate: "2025-08-01T23:59:59Z",
        assignedToUserIds: [],
        status: "Not Started",
        priority: "High",
        createdAt: "2025-07-20T10:00:00Z",
        updatedAt: "2025-07-20T10:00:00Z",
        subtasks: []
    },
    {
        id: "task_9_art_gala",
        boardId: "event_art_gala",
        title: "Contact Local Artists",
        description: "Reach out to local artists to showcase their work at the Art Gala.",
        bucket: "b",
        caption: "Artist Outreach",
        dueDate: "2025-08-10T23:59:59Z",
        assignedToUserIds: ["user7_gala_coord"],
        status: "In Progress",
        priority: "Medium",
        createdAt: "2025-07-21T11:00:00Z",
        updatedAt: "2025-07-21T11:00:00Z",
        subtasks: []
    },
];

export const getMockUsers = (): UserProfileData[] => {
    return MOCK_USERS;
};

export const getMockBoards = (userId: string) => {
    const myBoards = MOCK_BOARDS.filter(board => board.memberUids.includes(userId));
    const otherBoards = MOCK_BOARDS.filter(board => !board.memberUids.includes(userId));
    return { myBoards, otherBoards, allBoards: MOCK_BOARDS };
};

export const getMockTasksForBoard = (boardId: string): Task[] => {
    return MOCK_TASKS.filter(task => task.boardId === boardId);
};

export const getMockTasksForUser = (userId: string): Task[] => {
    return MOCK_TASKS.filter(task => task.assignedToUserIds.includes(userId));
}

/**
 * --- SIMULATING WRITE OPERATIONS (CONCEPT) ---
 * 
 * This mock data setup is for reading only. To simulate write operations (Create, Update, Delete)
 * without a backend, you would manage the state within your React components.
 * 
 * Example using React's useState hook:
 *
 * const [tasks, setTasks] = useState([]);
 * 
 * useEffect(() => {
 *   // On initial load, fetch the mock data
 *   setTasks(getMockTasksForBoard('some-board-id'));
 * }, []);
 * 
 * // CREATE:
 * const handleAddTask = (newTaskData) => {
 *   const newTask = {
 *     id: `mock_${Date.now()}`, // Generate a temporary ID
 *     ...newTaskData,
 *     createdAt: new Date().toISOString(),
 *     updatedAt: new Date().toISOString(),
 *   };
 *   setTasks(prevTasks => [...prevTasks, newTask]);
 * };
 * 
 * // UPDATE:
 * const handleUpdateTask = (taskId, updatedData) => {
 *   setTasks(prevTasks => 
 *     prevTasks.map(task => 
 *       task.id === taskId ? { ...task, ...updatedData, updatedAt: new Date().toISOString() } : task
 *     )
 *   );
 * };
 * 
 * // DELETE:
 * const handleDeleteTask = (taskId) => {
 *   setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
 * };
 * 
 * This approach keeps all changes in the client's memory. When you're ready to integrate with
 * Firestore, you would replace these `setTasks` calls with your Firestore SDK functions 
 * (e.g., `addDoc`, `updateDoc`, `deleteDoc`).
 */
