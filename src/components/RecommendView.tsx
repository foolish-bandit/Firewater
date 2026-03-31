import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles, ChevronRight } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Liquor, FlavorProfile } from '../data';
import { getFlavorVector, cosineSimilarity } from '../utils/liquorUtils';

interface RecommendViewProps {
  liquors: Liquor[];
  wantToTry: string[];
  tried: string[];
}

// --- Quiz Types ---

interface QuizAnswer {
  label: string;
  value: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'sweetSpice',
    question: 'Do you prefer your liquor...',
    answers: [
      { label: 'Sweet & Smooth', value: 'sweet' },
      { label: 'Spicy & Bold', value: 'spicy' },
      { label: 'Balanced', value: 'balanced' },
    ],
  },
  {
    id: 'oak',
    question: 'Oak and wood notes?',
    answers: [
      { label: 'Love them', value: 'high' },
      { label: "They're fine", value: 'medium' },
      { label: 'Not for me', value: 'low' },
    ],
  },
  {
    id: 'smoky',
    question: 'How about smoky flavors?',
    answers: [
      { label: 'Bring it on', value: 'high' },
      { label: 'A little is nice', value: 'medium' },
      { label: 'Skip it', value: 'low' },
    ],
  },
  {
    id: 'price',
    question: 'Price range?',
    answers: [
      { label: 'Under $40', value: 'low' },
      { label: '$40 - $80', value: 'mid' },
      { label: '$80+', value: 'high' },
      { label: 'No preference', value: 'any' },
    ],
  },
  {
    id: 'proof',
    question: 'Proof preference?',
    answers: [
      { label: 'Easy sipper (80-90)', value: 'low' },
      { label: 'Middle ground (90-110)', value: 'mid' },
      { label: 'Barrel proof (110+)', value: 'high' },
      { label: 'No preference', value: 'any' },
    ],
  },
];

function quizAnswersToProfile(answers: Record<string, string>): { profile: FlavorProfile; priceFilter: string; proofFilter: string } {
  const profile: FlavorProfile = {
    sweetness: 5, spice: 5, oak: 5, caramel: 5, vanilla: 5,
    fruit: 5, nutty: 5, floral: 5, smoky: 5, leather: 5,
    heat: 5, complexity: 5,
  };

  // Sweet vs Spicy
  if (answers.sweetSpice === 'sweet') {
    profile.sweetness = 9; profile.caramel = 8; profile.vanilla = 8;
    profile.spice = 3; profile.heat = 3; profile.leather = 3;
    profile.fruit = 7; profile.floral = 6;
  } else if (answers.sweetSpice === 'spicy') {
    profile.spice = 9; profile.heat = 8; profile.leather = 7;
    profile.sweetness = 4; profile.caramel = 4;
    profile.complexity = 8; profile.oak = 7;
  } else {
    // balanced — keep defaults
    profile.complexity = 7;
  }

  // Oak
  if (answers.oak === 'high') {
    profile.oak = 9; profile.leather = Math.max(profile.leather, 7);
    profile.complexity = Math.max(profile.complexity, 7);
  } else if (answers.oak === 'low') {
    profile.oak = 2; profile.leather = Math.min(profile.leather, 3);
  }

  // Smoky
  if (answers.smoky === 'high') {
    profile.smoky = 9;
  } else if (answers.smoky === 'medium') {
    profile.smoky = 5;
  } else if (answers.smoky === 'low') {
    profile.smoky = 1;
  }

  // Proof affects heat
  if (answers.proof === 'high') {
    profile.heat = Math.max(profile.heat, 8);
  } else if (answers.proof === 'low') {
    profile.heat = Math.min(profile.heat, 3);
  }

  return { profile, priceFilter: answers.price || 'any', proofFilter: answers.proof || 'any' };
}

function filterByPriceProof(liquors: Liquor[], priceFilter: string, proofFilter: string): Liquor[] {
  return liquors.filter(b => {
    if (priceFilter === 'low' && b.price >= 40) return false;
    if (priceFilter === 'mid' && (b.price < 40 || b.price > 80)) return false;
    if (priceFilter === 'high' && b.price < 80) return false;
    if (proofFilter === 'low' && (b.proof < 80 || b.proof > 90)) return false;
    if (proofFilter === 'mid' && (b.proof < 90 || b.proof > 110)) return false;
    if (proofFilter === 'high' && b.proof < 110) return false;
    return true;
  });
}

function getRecommendations(
  targetProfile: FlavorProfile,
  liquors: Liquor[],
  excludeIds: Set<string>,
  limit: number
): { liquor: Liquor; score: number }[] {
  const targetVec = getFlavorVector(targetProfile);
  const scored = liquors
    .filter(b => !excludeIds.has(b.id))
    .map(b => ({
      liquor: b,
      score: cosineSimilarity(targetVec, getFlavorVector(b.flavorProfile)),
    }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function computeAverageProfile(liquors: Liquor[]): FlavorProfile {
  const keys: (keyof FlavorProfile)[] = [
    'sweetness', 'spice', 'oak', 'caramel', 'vanilla',
    'fruit', 'nutty', 'floral', 'smoky', 'leather', 'heat', 'complexity',
  ];
  const avg: Record<string, number> = {};
  for (const key of keys) {
    const sum = liquors.reduce((acc, b) => acc + b.flavorProfile[key], 0);
    avg[key] = liquors.length > 0 ? sum / liquors.length : 5;
  }
  return avg as unknown as FlavorProfile;
}

function profileToRadarData(profile: FlavorProfile) {
  return Object.entries(profile).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: Math.round(value * 10) / 10,
    fullMark: 10,
  }));
}

// --- Components ---

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-3 h-3 bg-[#C89B3C]'
              : i < current
              ? 'w-2 h-2 bg-[#C89B3C]/50'
              : 'w-2 h-2 bg-[#EAE4D9]/15'
          }`}
        />
      ))}
    </div>
  );
}

function QuizStep({
  question,
  onAnswer,
  onBack,
  currentStep,
  totalSteps,
  selectedValue,
}: {
  question: QuizQuestion;
  onAnswer: (value: string) => void;
  onBack: (() => void) | null;
  currentStep: number;
  totalSteps: number;
  selectedValue?: string;
}) {
  return (
    <div className="w-full max-w-xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
      <ProgressDots current={currentStep} total={totalSteps} />

      <div className="text-center mb-10">
        <p className="micro-label text-[#C89B3C] mb-3">
          Question {currentStep + 1} of {totalSteps}
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-[#EAE4D9] leading-tight">
          {question.question}
        </h2>
      </div>

      <div className="space-y-4">
        {question.answers.map((answer) => (
          <button
            key={answer.value}
            onClick={() => onAnswer(answer.value)}
            className={`w-full p-6 bg-[#1A1816] vintage-border text-left transition-all duration-300 group hover:border-[#C89B3C] hover:-translate-y-0.5 ${
              selectedValue === answer.value
                ? 'border-[#C89B3C] bg-[#C89B3C]/10'
                : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-xl text-[#EAE4D9] group-hover:text-[#C89B3C] transition-colors">
                {answer.label}
              </span>
              <ChevronRight
                size={18}
                className="text-[#EAE4D9]/20 group-hover:text-[#C89B3C] group-hover:translate-x-1 transition-all"
              />
            </div>
          </button>
        ))}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-8 flex items-center gap-2 text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors text-sm font-semibold tracking-widest uppercase mx-auto"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}
    </div>
  );
}

function RecommendationCard({
  liquor,
  score,
  onClick,
}: {
  liquor: Liquor;
  score: number;
  onClick: () => void;
}) {
  const matchPercent = Math.round(score * 100);
  const topFlavors = useMemo(() => {
    const entries = Object.entries(liquor.flavorProfile);
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 2).map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
  }, [liquor]);

  return (
    <div
      onClick={onClick}
      className="group bg-[#1A1816] vintage-border overflow-hidden cursor-pointer hover:border-[#C89B3C] card-glow-hover transition-all duration-500 flex flex-col h-full relative hover:-translate-y-1"
    >
      {/* Top accent bar */}
      <div className="h-[2px] w-[15%] group-hover:w-full bg-gradient-to-r from-[#C89B3C] to-[#E8C56D] transition-all duration-700 ease-out" />

      {/* Match badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className="px-3 py-1.5 bg-[#C89B3C]/20 border border-[#C89B3C]/40 rounded-full backdrop-blur-sm">
          <span className="text-[#C89B3C] text-xs font-sans font-bold tracking-wider">
            {matchPercent}% Match
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-serif text-2xl font-normal text-[#EAE4D9] group-hover:text-[#C89B3C] transition-colors leading-tight mb-2 pr-24">
          {liquor.name}
        </h3>

        <p className="micro-label text-[#C89B3C] mb-3">{liquor.distillery}</p>

        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 bg-[#141210]/90 text-[10px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] vintage-border">
            {liquor.proof} Proof
          </span>
          <span className="font-serif text-lg italic text-[#EAE4D9]/70">
            ${liquor.price}
          </span>
        </div>

        {/* Top flavors */}
        <div className="flex gap-2 mb-4">
          {topFlavors.map((flavor) => (
            <span
              key={flavor}
              className="px-2 py-0.5 text-[9px] font-sans font-medium tracking-wider uppercase text-[#EAE4D9]/50 border border-[#EAE4D9]/10 rounded-full"
            >
              {flavor}
            </span>
          ))}
        </div>

        <p className="text-sm text-[#EAE4D9]/60 line-clamp-2 flex-1 font-serif italic leading-relaxed">
          {liquor.description}
        </p>

        <div className="flex items-center gap-2 text-[#C89B3C] text-xs font-semibold tracking-widest uppercase mt-4 group-hover:gap-3 transition-all">
          <span>View Details</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}

function FlavorRadar({ profile }: { profile: FlavorProfile }) {
  const data = useMemo(() => profileToRadarData(profile), [profile]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <p className="micro-label text-[#C89B3C] mb-2">Your Flavor Profile</p>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="rgba(234, 228, 217, 0.08)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'rgba(234, 228, 217, 0.4)', fontSize: 10, fontFamily: 'Montserrat' }}
            />
            <Radar
              name="Your Palate"
              dataKey="A"
              stroke="#C89B3C"
              fill="#C89B3C"
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ResultsView({
  recommendations,
  profile,
  onReset,
  title,
  subtitle,
}: {
  recommendations: { liquor: Liquor; score: number }[];
  profile: FlavorProfile;
  onReset?: () => void;
  title: string;
  subtitle: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-700 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full vintage-border flex items-center justify-center mx-auto mb-4 text-[#C89B3C]">
          <Sparkles size={24} />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-[#EAE4D9]">{title}</h1>
        <p className="text-[#EAE4D9]/60 font-serif italic text-lg">{subtitle}</p>
      </div>

      {/* Radar Chart */}
      <div className="bg-[#1A1816] vintage-border p-6 max-w-lg mx-auto">
        <FlavorRadar profile={profile} />
      </div>

      {/* Results Grid */}
      <div>
        <div className="text-center mb-8">
          <p className="micro-label text-[#C89B3C] mb-2">Top Picks</p>
          <h2 className="font-serif text-3xl text-[#EAE4D9]">We Think You'll Love</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map(({ liquor, score }) => (
            <RecommendationCard
              key={liquor.id}
              liquor={liquor}
              score={score}
              onClick={() => navigate(`/liquor/${liquor.id}`)}
            />
          ))}
        </div>

        {recommendations.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#EAE4D9]/40 font-serif italic text-lg">
              No matches found with those filters. Try broadening your preferences.
            </p>
          </div>
        )}
      </div>

      {/* Reset */}
      {onReset && (
        <div className="text-center pt-4">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase px-8 py-4 transition-all duration-300 text-sm"
          >
            <RotateCcw size={16} /> Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---

export default function RecommendView({ liquors, wantToTry, tried }: RecommendViewProps) {
  const hasTriedLiquors = tried.length > 0;

  // Quiz state
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // "For You" mode: compute from tried list
  const forYouData = useMemo(() => {
    if (!hasTriedLiquors) return null;

    const triedLiquors = liquors.filter((b) => tried.includes(b.id));
    if (triedLiquors.length === 0) return null;

    const avgProfile = computeAverageProfile(triedLiquors);
    const excludeIds = new Set([...tried, ...wantToTry]);
    const recs = getRecommendations(avgProfile, liquors, excludeIds, 8);

    return { profile: avgProfile, recommendations: recs };
  }, [liquors, tried, wantToTry, hasTriedLiquors]);

  // Quiz mode: compute from answers
  const quizData = useMemo(() => {
    if (!quizComplete) return null;

    const { profile, priceFilter, proofFilter } = quizAnswersToProfile(quizAnswers);
    let candidates = filterByPriceProof(liquors, priceFilter, proofFilter);

    // If filters too narrow, fall back to all
    if (candidates.length < 8) {
      candidates = liquors;
    }

    const excludeIds = new Set([...tried, ...wantToTry]);
    const recs = getRecommendations(profile, candidates, excludeIds, 8);

    return { profile, recommendations: recs };
  }, [quizComplete, quizAnswers, liquors, tried, wantToTry]);

  const handleQuizAnswer = useCallback(
    (value: string) => {
      const question = QUIZ_QUESTIONS[quizStep];
      const newAnswers = { ...quizAnswers, [question.id]: value };
      setQuizAnswers(newAnswers);

      if (quizStep < QUIZ_QUESTIONS.length - 1) {
        setQuizStep(quizStep + 1);
      } else {
        setQuizComplete(true);
      }
    },
    [quizStep, quizAnswers]
  );

  const handleQuizBack = useCallback(() => {
    if (quizStep > 0) {
      setQuizStep(quizStep - 1);
    }
  }, [quizStep]);

  const handleQuizReset = useCallback(() => {
    setQuizStep(0);
    setQuizAnswers({});
    setQuizComplete(false);
  }, []);

  // --- Render ---

  // Mode A: "For You" with tried liquors (and not switched to quiz)
  if (forYouData && !showQuiz) {
    return (
      <div className="min-h-[80vh] animate-in fade-in duration-700 space-y-12">
        <ResultsView
          recommendations={forYouData.recommendations}
          profile={forYouData.profile}
          title="Recommended For You"
          subtitle="Based on your tasting history"
        />

        {/* Also offer the quiz */}
        <div className="section-divider" />
        <div className="text-center space-y-4 pb-8">
          <p className="text-[#EAE4D9]/50 font-serif italic">
            Want a different angle? Try the flavor quiz.
          </p>
          <button
            onClick={() => {
              handleQuizReset();
              setShowQuiz(true);
            }}
            className="inline-flex items-center gap-2 vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase px-8 py-3 transition-all duration-300 text-sm"
          >
            <ArrowRight size={16} /> Take the Flavor Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz results
  if (quizComplete && quizData) {
    return (
      <div className="min-h-[80vh]">
        <ResultsView
          recommendations={quizData.recommendations}
          profile={quizData.profile}
          onReset={handleQuizReset}
          title="Your Matches"
          subtitle="Based on your flavor preferences"
        />
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="min-h-[80vh] flex flex-col items-center pt-8 md:pt-16 animate-in fade-in duration-700">
      {/* Quiz intro header (only on first step) */}
      {quizStep === 0 && (
        <div className="text-center space-y-4 mb-12">
          <div className="w-14 h-14 rounded-full vintage-border flex items-center justify-center mx-auto mb-4 text-[#C89B3C]">
            <Sparkles size={24} />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-[#EAE4D9]">Flavor Quiz</h1>
          <p className="text-[#EAE4D9]/60 font-serif italic text-lg max-w-md mx-auto">
            Answer five quick questions and we'll match you with the perfect liquor.
          </p>
        </div>
      )}

      <QuizStep
        question={QUIZ_QUESTIONS[quizStep]}
        onAnswer={handleQuizAnswer}
        onBack={quizStep > 0 ? handleQuizBack : null}
        currentStep={quizStep}
        totalSteps={QUIZ_QUESTIONS.length}
        selectedValue={quizAnswers[QUIZ_QUESTIONS[quizStep].id]}
      />
    </div>
  );
}
