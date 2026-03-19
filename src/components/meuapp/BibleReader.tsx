import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const BIBLE_BOOKS = [
  { name: "Gênesis", abbrev: "gn", chapters: 50 },
  { name: "Êxodo", abbrev: "ex", chapters: 40 },
  { name: "Levítico", abbrev: "lv", chapters: 27 },
  { name: "Números", abbrev: "nm", chapters: 36 },
  { name: "Deuteronômio", abbrev: "dt", chapters: 34 },
  { name: "Josué", abbrev: "js", chapters: 24 },
  { name: "Juízes", abbrev: "jz", chapters: 21 },
  { name: "Rute", abbrev: "rt", chapters: 4 },
  { name: "1 Samuel", abbrev: "1sm", chapters: 31 },
  { name: "2 Samuel", abbrev: "2sm", chapters: 24 },
  { name: "1 Reis", abbrev: "1rs", chapters: 22 },
  { name: "2 Reis", abbrev: "2rs", chapters: 25 },
  { name: "1 Crônicas", abbrev: "1cr", chapters: 29 },
  { name: "2 Crônicas", abbrev: "2cr", chapters: 36 },
  { name: "Esdras", abbrev: "ed", chapters: 10 },
  { name: "Neemias", abbrev: "ne", chapters: 13 },
  { name: "Ester", abbrev: "et", chapters: 10 },
  { name: "Jó", abbrev: "job", chapters: 42 },
  { name: "Salmos", abbrev: "sl", chapters: 150 },
  { name: "Provérbios", abbrev: "pv", chapters: 31 },
  { name: "Eclesiastes", abbrev: "ec", chapters: 12 },
  { name: "Cânticos", abbrev: "ct", chapters: 8 },
  { name: "Isaías", abbrev: "is", chapters: 66 },
  { name: "Jeremias", abbrev: "jr", chapters: 52 },
  { name: "Lamentações", abbrev: "lm", chapters: 5 },
  { name: "Ezequiel", abbrev: "ez", chapters: 48 },
  { name: "Daniel", abbrev: "dn", chapters: 12 },
  { name: "Oséias", abbrev: "os", chapters: 14 },
  { name: "Joel", abbrev: "jl", chapters: 3 },
  { name: "Amós", abbrev: "am", chapters: 9 },
  { name: "Obadias", abbrev: "ob", chapters: 1 },
  { name: "Jonas", abbrev: "jn", chapters: 4 },
  { name: "Miquéias", abbrev: "mq", chapters: 7 },
  { name: "Naum", abbrev: "na", chapters: 3 },
  { name: "Habacuque", abbrev: "hc", chapters: 3 },
  { name: "Sofonias", abbrev: "sf", chapters: 3 },
  { name: "Ageu", abbrev: "ag", chapters: 2 },
  { name: "Zacarias", abbrev: "zc", chapters: 14 },
  { name: "Malaquias", abbrev: "ml", chapters: 4 },
  { name: "Mateus", abbrev: "mt", chapters: 28 },
  { name: "Marcos", abbrev: "mc", chapters: 16 },
  { name: "Lucas", abbrev: "lc", chapters: 24 },
  { name: "João", abbrev: "jo", chapters: 21 },
  { name: "Atos", abbrev: "at", chapters: 28 },
  { name: "Romanos", abbrev: "rm", chapters: 16 },
  { name: "1 Coríntios", abbrev: "1co", chapters: 16 },
  { name: "2 Coríntios", abbrev: "2co", chapters: 13 },
  { name: "Gálatas", abbrev: "gl", chapters: 6 },
  { name: "Efésios", abbrev: "ef", chapters: 6 },
  { name: "Filipenses", abbrev: "fp", chapters: 4 },
  { name: "Colossenses", abbrev: "cl", chapters: 4 },
  { name: "1 Tessalonicenses", abbrev: "1ts", chapters: 5 },
  { name: "2 Tessalonicenses", abbrev: "2ts", chapters: 3 },
  { name: "1 Timóteo", abbrev: "1tm", chapters: 6 },
  { name: "2 Timóteo", abbrev: "2tm", chapters: 4 },
  { name: "Tito", abbrev: "tt", chapters: 3 },
  { name: "Filemom", abbrev: "fm", chapters: 1 },
  { name: "Hebreus", abbrev: "hb", chapters: 13 },
  { name: "Tiago", abbrev: "tg", chapters: 5 },
  { name: "1 Pedro", abbrev: "1pe", chapters: 5 },
  { name: "2 Pedro", abbrev: "2pe", chapters: 3 },
  { name: "1 João", abbrev: "1jo", chapters: 5 },
  { name: "2 João", abbrev: "2jo", chapters: 1 },
  { name: "3 João", abbrev: "3jo", chapters: 1 },
  { name: "Judas", abbrev: "jd", chapters: 1 },
  { name: "Apocalipse", abbrev: "ap", chapters: 22 },
];

interface Verse {
  number: number;
  text: string;
}

export function BibleReader() {
  const [selectedBook, setSelectedBook] = useState<number>(0);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBooks, setShowBooks] = useState(true);

  const book = BIBLE_BOOKS[selectedBook];

  const fetchChapter = async (bookIdx: number, chapter: number) => {
    setLoading(true);
    setShowBooks(false);
    setSelectedBook(bookIdx);
    setSelectedChapter(chapter);
    try {
      const b = BIBLE_BOOKS[bookIdx];
      // Use bible-api.com with Almeida translation
      const res = await fetch(`https://bible-api.com/${b.abbrev}+${chapter}?translation=almeida`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.verses) {
        setVerses(data.verses.map((v: any) => ({ number: v.verse, text: v.text })));
      } else if (data.text) {
        // Fallback: split by newlines
        setVerses(data.text.split("\n").filter(Boolean).map((t: string, i: number) => ({ number: i + 1, text: t })));
      }
    } catch {
      // Fallback message
      setVerses([{ number: 1, text: "Não foi possível carregar este capítulo. Verifique sua conexão." }]);
    } finally {
      setLoading(false);
    }
  };

  const goChapter = (delta: number) => {
    const next = selectedChapter + delta;
    if (next >= 1 && next <= book.chapters) {
      fetchChapter(selectedBook, next);
    }
  };

  if (showBooks) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> Bíblia Sagrada
        </h3>

        {/* Old Testament */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Antigo Testamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-1.5">
              {BIBLE_BOOKS.slice(0, 39).map((b, i) => (
                <Button
                  key={b.abbrev}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs h-8"
                  onClick={() => fetchChapter(i, 1)}
                >
                  {b.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* New Testament */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Novo Testamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-1.5">
              {BIBLE_BOOKS.slice(39).map((b, i) => (
                <Button
                  key={b.abbrev}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs h-8"
                  onClick={() => fetchChapter(i + 39, 1)}
                >
                  {b.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowBooks(true)}>
          ← Livros
        </Button>
      </div>

      {/* Book/Chapter selector */}
      <div className="flex items-center gap-2">
        <Select value={selectedBook.toString()} onValueChange={(v) => fetchChapter(parseInt(v), 1)}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BIBLE_BOOKS.map((b, i) => (
              <SelectItem key={b.abbrev} value={i.toString()}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedChapter.toString()} onValueChange={(v) => fetchChapter(selectedBook, parseInt(v))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: book.chapters }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chapter title */}
      <h3 className="text-lg font-bold text-center">
        {book.name} {selectedChapter}
      </h3>

      {/* Verses */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2 text-sm leading-relaxed">
                {verses.map((v) => (
                  <p key={v.number}>
                    <span className="text-xs font-bold text-primary mr-1">{v.number}</span>
                    {v.text}
                  </p>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={selectedChapter <= 1}
          onClick={() => goChapter(-1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        <span className="text-xs text-muted-foreground">
          Cap. {selectedChapter} de {book.chapters}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedChapter >= book.chapters}
          onClick={() => goChapter(1)}
        >
          Próximo <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
