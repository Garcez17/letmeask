import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';

import { Button } from '../components/Button';
import { RoomCode } from '../components/RoomCode';

import { useAuth } from '../hooks/useAuth';
import { database } from '../services/firebase';

import logoImg from '../assets/images/logo.svg';

import '../styles/room.scss';

type FirebaseQuestions = Record<string, {
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  isAnswered: boolean;
  isHighlighted: boolean;
}>;

type Question = {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  isAnswered: boolean;
  isHighlighted: boolean;
}

type RoomParams = {
  id: string;
}

export function Room() {
  const { user } = useAuth();
  const { id: roomId } = useParams<RoomParams>();

  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const roomRef = database.ref(`rooms/${roomId}`);

    roomRef.on('value', room => {
      const databaseRoom = room.val();
      const firebaseQuestion: FirebaseQuestions = databaseRoom.questions ?? {};

      const parsedQuestions = Object.entries(firebaseQuestion).map(([key, value]) => {
        const { author, content, isAnswered, isHighlighted } = value;

        return {
          id: key,
          author, 
          content, 
          isAnswered, 
          isHighlighted
        }
      });

      setTitle(databaseRoom.title);
      setQuestions(parsedQuestions);
    })
  }, [roomId]);

  async function handleSendQuestion(e: FormEvent) {
    e.preventDefault();

    if (newQuestion.trim() === '') return;

    if (!user) {
      toast.error('Você deve estar logado para fazer uma pergunta');
      return;
    };

    const question = {
      content: newQuestion,
      author: {
        name: user.name,
        avatar: user.avatar,
      },
      isAnswered: false,
      isHighlighted: false,
    }

    await database.ref(`rooms/${roomId}/questions`).push(question);

    toast.success('Pergunta enviada!');

    setNewQuestion('');
  } 

  return (
    <div id="page-room">
      <Toaster
        position="bottom-center"
        reverseOrder={true}
      />

      <header>
        <div className="content">
          <img src={logoImg} alt="letmeask" />
          <RoomCode code={roomId} />
        </div>
      </header>

      <main>
        <div className="room-title">
          <h1>Sala {title}</h1>
          {questions.length > 0 && <span>{questions.length} pergunta(s)</span>}
        </div>

        <form onSubmit={handleSendQuestion}>
          <textarea 
            placeholder="O que você quer perguntar?"
            onChange={e => setNewQuestion(e.target.value)}
            value={newQuestion}
          />

          <div className="form-footer">
            {user ? (
              <div className="user-info">
                <img src={user.avatar} alt={user.name} />
                <span>{user.name}</span>
              </div>
            ) : (
              <span>Para enviar uma pergunta, <button>faça seu login</button></span>
            )}

            <Button type="submit" disabled={!user}>Enviar pergunta</Button>
          </div>
        </form>
      </main>
    </div>
  )
}