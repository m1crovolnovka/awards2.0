export type Role = 'USER' | 'ADMIN';

export interface UserMe {
  id: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  role: Role;
  mustChangePassword: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserMe;
}

export interface NomineeBrief {
  id: number;
  name: string;
  imageUrl: string | null;
}

export interface NominationCard {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  createdAt: string;
  nominees: NomineeBrief[];
  myVoteNomineeId: number | null;
  totalVotes: number | null;
}

export interface VotingStatus {
  votingOpen: boolean;
  announcementAt: string | null;
}

export interface NomineeAdminView {
  id: number;
  name: string;
  reportName: string;
  imageUrl: string | null;
}

export interface NomineeVoteCount {
  nomineeId: number;
  name: string;
  votes: number;
}

export interface NominationStats {
  nominationId: number;
  title: string;
  totalVotes: number;
  hasTie: boolean;
  winnerNomineeId: number | null;
  leaders: NomineeVoteCount[];
  breakdown: NomineeVoteCount[];
}

export interface PublicConfig {
  telegramBotUsername: string;
  votingOpen: boolean;
  announcementAt: string;
}
