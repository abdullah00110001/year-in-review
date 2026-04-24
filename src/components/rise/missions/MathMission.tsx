import { useState, useEffect } from 'react';
import { Calculator, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MathMissionProps {
  onComplete: () => void;
  requiredSolves?: number; // কয়টা অঙ্ক মিলাতে হবে
}

export function MathMission({ onComplete, requiredSolves = 3 }: MathMissionProps) {
  const [problem, setProblem] = useState({ question: '', answer: 0 });
  const [userInput, setUserInput] = useState('');
  const [solvedCount, setSolvedCount] = useState(0);
  const [isError, setIsError] = useState(false);

  // ১. র‍্যান্ডম ম্যাথ জেনারেটর (Medium Difficulty)
  const generateMathProblem = () => {
    const num1 = Math.floor(Math.random() * 90) + 10; // 10-99
    const num2 = Math.floor(Math.random() * 90) + 10; // 10-99
    const operators = ['+', '-'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer = 0;
    let question = '';

    if (operator === '+') {
      answer = num1 + num2;
      question = `${num1} + ${num2}`;
    } else {
      // বিয়োগের সময় উত্তর যেন মাইনাস না হয়, তাই বড়টা আগে
      const max = Math.max(num1, num2);
      const min = Math.min(num1, num2);
      answer = max - min;
      question = `${max} - ${min}`;
    }

    setProblem({ question, answer });
    setUserInput('');
  };

  // কম্পোনেন্ট লোড হলেই প্রথম অঙ্ক জেনারেট হবে
  useEffect(() => {
    generateMathProblem();
  }, []);

  // ২. ইনপুট চেকার (সঠিক হলে অ্যালার্মের নেক্সট ধাপে যাবে)
  useEffect(() => {
    if (userInput.length > 0 && parseInt(userInput) === problem.answer) {
      const newSolvedCount = solvedCount + 1;
      setSolvedCount(newSolvedCount);
      toast.success(`Correct! ${newSolvedCount}/${requiredSolves} solved`);

      if (newSolvedCount >= requiredSolves) {
        setTimeout(() => {
          onComplete(); // মিশন কমপ্লিট! অ্যালার্ম বন্ধ করার সিগন্যাল
        }, 500);
      } else {
        generateMathProblem(); // পরের অঙ্কে যাও
      }
    } else if (userInput.length >= problem.answer.toString().length && parseInt(userInput) !== problem.answer) {
      // ভুল উত্তর দিলে ইনপুট লাল হবে
      setIsError(true);
      setTimeout(() => {
        setIsError(false);
        setUserInput('');
      }, 500);
    }
  }, [userInput]);

  // ৩. কাস্টম নাম্বার প্যাড লজিক
  const handleNumberPress = (num: string) => {
    if (userInput.length < 5) {
      setUserInput((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setUserInput((prev) => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white p-6">
      
      {/* 🧠 Header & Progress */}
      <div className="flex items-center justify-between mb-10 mt-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-2xl">
            <Calculator className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold">Math Mission</h2>
        </div>
        <div className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
          {solvedCount} / {requiredSolves}
        </div>
      </div>

      {/* 🧮 The Math Problem */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 mb-8">
        <div className="text-5xl font-black tracking-wider text-white/90">
          {problem.question} = ?
        </div>
        
        {/* User Input Display */}
        <div className={`h-20 w-full max-w-xs flex items-center justify-center text-4xl font-bold rounded-2xl border-2 transition-all ${
          isError 
            ? 'border-rose-500 text-rose-500 bg-rose-500/10 translate-x-1' 
            : userInput 
              ? 'border-indigo-500 text-white bg-indigo-500/10' 
              : 'border-white/10 text-white/20 bg-white/5'
        }`}>
          {userInput || "Tap numbers"}
        </div>
      </div>

      {/* 🔢 Custom Numpad (No OS Keyboard needed) */}
      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto w-full pb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            className="h-16 text-2xl font-semibold bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl"
            onClick={() => handleNumberPress(num.toString())}
          >
            {num}
          </Button>
        ))}
        <div className="col-start-2">
          <Button
            variant="outline"
            className="h-16 w-full text-2xl font-semibold bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl"
            onClick={() => handleNumberPress('0')}
          >
            0
          </Button>
        </div>
        <Button
          variant="outline"
          className="h-16 bg-white/5 border-white/10 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 text-white/60 rounded-2xl"
          onClick={handleDelete}
        >
          <Delete className="h-6 w-6" />
        </Button>
      </div>

    </div>
  );
}
