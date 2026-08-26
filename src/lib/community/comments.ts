import {
  collection,
  setDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  increment,
  updateDoc,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorNickname: string;
  body: string;
  parentId: string | null;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

function toComment(snap: DocumentSnapshot): Comment {
  const d = snap.data()!;
  return {
    id: snap.id,
    postId: d.postId,
    authorId: d.authorId,
    authorNickname: d.authorNickname,
    body: d.body,
    parentId: d.parentId ?? null,
    createdAt: d.createdAt ?? null,
  };
}

/** 댓글 목록 조회 */
export async function getComments(postId: string): Promise<Comment[]> {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(toComment);
}

/** 댓글 작성 */
export async function createComment(data: {
  postId: string;
  authorId: string;
  authorNickname: string;
  body: string;
  parentId: string | null;
}): Promise<string> {
  const commentRef = doc(collection(db, "posts", data.postId, "comments"));
  await setDoc(commentRef, { ...data, createdAt: serverTimestamp() });
  updateDoc(doc(db, "posts", data.postId), { commentCount: increment(1) }).catch(() => {});
  return commentRef.id;
}

/** 댓글 삭제 */
export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, "posts", postId, "comments", commentId));
  updateDoc(doc(db, "posts", postId), { commentCount: increment(-1) }).catch(() => {});
}
