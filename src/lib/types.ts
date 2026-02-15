export type Role = 'proponent' | 'opponent' | 'system';

export interface Message {
    id: string;
    role: Role;
    content: string;
    timestamp: Date;
}

export interface DebateState {
    topic: string;
    isActive: boolean;
    messages: Message[];
    turn: Role;
}
