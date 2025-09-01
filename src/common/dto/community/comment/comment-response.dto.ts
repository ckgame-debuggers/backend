export class CommentResponseDto {
  id: number;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  dislikes: number;
  isUnknown: boolean;
  writer: {
    id: number;
    schoolNumber: string;
    user: {
      nickname: string;
      profileImage?: string;
      color?: string;
    };
    defaultBadge?: {
      id: number;
      name: string;
      image: string;
    };
  };
  parent?: {
    id: number;
    writer: {
      user: {
        nickname: string;
        color?: string;
      };
    };
  };
  replies: CommentResponseDto[];
  replyCount: number;
}
