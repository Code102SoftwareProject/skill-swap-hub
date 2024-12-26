export interface Forum {
    id: string;
    title: string;
    description: string;
    posts: number;
    replies: number;
    lastActive: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ForumSearchResult extends Forum {
    score: number;
    highlight?: {
      title?: string[];
      description?: string[];
    };
  }