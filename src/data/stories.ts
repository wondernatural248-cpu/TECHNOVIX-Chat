import { Story } from '../types/chat';

export const initialStories: Story[] = [
  {
    id: 'story_1',
    userId: 'tech_story_1',
    userName: 'TECHNOVIX Protocol',
    userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    userHandle: 'technovix.core',
    hasUnread: true,
    lastUpdated: '1h ago',
    items: [
      {
        id: 'st_item_1_1',
        mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        caption: 'Quantum encrypted real-time communications live on the mesh 🚀',
        timestamp: '1h ago',
        durationSeconds: 5,
      },
      {
        id: 'st_item_1_2',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
        caption: 'PostgreSQL Row Level Security isolating private message channels 🔒',
        timestamp: '45m ago',
        durationSeconds: 5,
      },
    ],
  },
  {
    id: 'story_2',
    userId: 'tech_story_2',
    userName: 'Neon Grid News',
    userAvatar: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&auto=format&fit=crop&q=80',
    userHandle: 'neon.grid',
    hasUnread: true,
    lastUpdated: '3h ago',
    items: [
      {
        id: 'st_item_2_1',
        mediaUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
        caption: 'CYBER DRIFT 3D flagship racing engine active in TECHNOVIX Arcade 🏁',
        timestamp: '3h ago',
        durationSeconds: 5,
      },
    ],
  },
];
