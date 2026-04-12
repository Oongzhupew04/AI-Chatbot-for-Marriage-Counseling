import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface ChatPayload {
    message: string;
    chatId: number | null;
}

interface ChatResponse {
    response: string;
    action: string;
    risk_level: number;
    chatId?: number;
}

export const useChatMutation = () => {
    return useMutation<ChatResponse, Error, ChatPayload>({
        mutationFn: async (payload) => {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                'http://localhost:3000/api/chat',
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return data;
        }
    });
};