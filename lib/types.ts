export type Medium = 'book' | 'film' | 'tv show';
export type Status = 'pending' | 'approved' | 'rejected';
export type Category =
  | 'How to Think'
  | 'How to Survive'
  | 'How to Thrive & Build'
  | 'How to Love & Be Loved'
  | 'How to Grieve & Face Loss'
  | 'How to Know Yourself'
  | 'How to be Human & Kind'
  | 'How to Lead & Serve'
  | 'How to Stay Alive Inside'
  | 'How to Face Power & Injustice';

export interface Entry {
  id: string;
  title: string;
  author: string;
  medium: Medium;
  category: Category;
  cover_image: string | null;
  timelessness_note: string;
  human_moment: string;
  contributor_name: string;
  article_link: string | null;
  status: Status;
  created_at: string;
}
