import React, { useMemo, useState } from 'react';
import { WORD_FRAME_MAP } from '../../src/avatar';
import { PanelSection, TextInput, Button, Badge } from './ui';

interface MappedWordsViewProps {
  onSelectWord: (word: string) => void;
  onBack: () => void;
}

// Renders the searchable grid of words mapped to mouth frame animations.
export const MappedWordsView: React.FC<MappedWordsViewProps> = ({
  onSelectWord,
  onBack,
}) => {
  const [filterQuery, setFilterQuery] = useState<string>('');

  const allWords = useMemo(() => {
    return Object.keys(WORD_FRAME_MAP).sort();
  }, []);

  const filteredWords = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return allWords;
    return allWords.filter((word) => word.toLowerCase().includes(query));
  }, [allWords, filterQuery]);

  return (
    <PanelSection
      id="section-mapped-words"
      bgVariant="mapped"
      style={{ display: 'flex' }}
    >
      <div className="mapped-words-top">
        <h2 className="section-title">
          <span className="title-icon">📖</span>
          Mapped Words <Badge variant="count" id="mapped-words-count">({filteredWords.length})</Badge>
        </h2>
        <Button
          id="btn-back-mapped"
          variant="back"
          icon="⬅️"
          onClick={onBack}
        >
          Back
        </Button>
      </div>

      <div className="search-box-container">
        <TextInput
          id="mapped-search-input"
          className="search-input"
          value={filterQuery}
          onChange={setFilterQuery}
          placeholder="🔍 Search mapped words..."
        />
      </div>

      <div id="mapped-words-grid" className="mapped-words-grid">
        {filteredWords.length === 0 ? (
          <div className="no-words-msg">
            No mapped words found matching &quot;{filterQuery}&quot;
          </div>
        ) : (
          filteredWords.map((word) => (
            <Button
              key={word}
              variant="chip"
              title={`Test mouth animation for "${word}"`}
              onClick={() => onSelectWord(word)}
            >
              {word}
            </Button>
          ))
        )}
      </div>
    </PanelSection>
  );
};
