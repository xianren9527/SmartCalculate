import React, { useState } from 'react';
import { Calculator, Brain, History, Backspace } from 'lucide-react';
import * as math from 'mathjs';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

function App() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'ai' | 'calculator'>('ai');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<Array<{ input: string; result: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [display, setDisplay] = useState('0');

  const processWithAI = async (text: string) => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://localhost:5173',
          'X-Title': 'Smart Calculator'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro-exp-03-25:free',
          messages: [
            {
              role: 'system',
              content: `You are a mathematical expression parser. Given a natural language query about a mathematical calculation:
              1. Extract the mathematical operation and numbers
              2. Return ONLY a valid mathematical expression that can be evaluated
              3. Do not include any explanations or additional text
              4. Use basic operators (+, -, *, /, %, ^) and parentheses only
              Example input: "What is fifteen percent of eighty plus twenty five?"
              Example output: (80 * 0.15) + 25`
            },
            {
              role: 'user',
              content: text
            }
          ]
        })
      });

      const data = await response.json();
      const expression = data.choices[0].message.content.trim();
      
      if (!expression) {
        return 'Could not parse the mathematical expression';
      }

      // Evaluate the expression using mathjs
      return math.evaluate(expression).toString();
    } catch (error) {
      console.error('AI processing error:', error);
      return 'Error processing the request';
    }
  };

  const handleCalcButtonClick = (value: string) => {
    if (value === 'C') {
      setDisplay('0');
    } else if (value === '=') {
      try {
        const calculatedResult = math.evaluate(display).toString();
        setResult(calculatedResult);
        setHistory(prev => [...prev, { input: display, result: calculatedResult }]);
      } catch (error) {
        setResult('Invalid expression');
      }
    } else if (value === 'backspace') {
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      setDisplay(prev => prev === '0' ? value : prev + value);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      let calculatedResult: string;
      
      if (mode === 'calculator') {
        try {
          calculatedResult = math.evaluate(display).toString();
        } catch (error) {
          calculatedResult = 'Invalid expression';
        }
      } else {
        calculatedResult = await processWithAI(input);
      }

      setResult(calculatedResult);
      setHistory(prev => [...prev, { 
        input: mode === 'calculator' ? display : input, 
        result: calculatedResult 
      }]);
    } catch (error) {
      setResult('An error occurred');
    }
    setIsLoading(false);
  };

  const renderCalculator = () => {
    const buttons = [
      ['7', '8', '9', '/'],
      ['4', '5', '6', '*'],
      ['1', '2', '3', '-'],
      ['0', '.', '=', '+'],
      ['(', ')', '%', '^'],
      ['C', 'backspace']
    ];

    return (
      <div className="mt-4">
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <p className="text-right text-xl font-mono overflow-x-auto">{display}</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {buttons.flat().map((btn, index) => (
            <button
              key={index}
              onClick={() => handleCalcButtonClick(btn)}
              className={`py-3 px-4 rounded-lg text-center ${
                btn === '=' 
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : btn === 'C'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : btn === 'backspace'
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600 col-span-3'
                      : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {btn === 'backspace' ? <Backspace className="mx-auto" size={20} /> : btn}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Smart Calculator</h1>
          <p className="text-gray-600">Natural language calculations made simple</p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('ai')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                mode === 'ai'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Brain size={20} />
              AI Mode
            </button>
            <button
              onClick={() => setMode('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                mode === 'calculator'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calculator size={20} />
              Calculator Mode
            </button>
          </div>

          {mode === 'ai' ? (
            <>
              <div className="mb-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything... (e.g., 'What is the sum of fifteen percent of eighty and twenty five?')"
                  className="w-full h-24 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {isLoading ? 'Calculating...' : 'Calculate'}
              </button>
            </>
          ) : (
            renderCalculator()
          )}

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Result</h2>
              <p className="text-2xl font-bold text-blue-600">{result}</p>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <History size={20} className="text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">History</h2>
            </div>
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-1">{item.input}</p>
                  <p className="text-blue-600 font-semibold">{item.result}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
