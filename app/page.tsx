import { Deck } from '@/components/Deck';
import { SLIDES } from '@/content/slides';

export default function Home() {
  return <Deck slides={SLIDES} />;
}
