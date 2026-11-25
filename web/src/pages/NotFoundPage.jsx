import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { Home, Compass } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-3xl font-black mb-6 shadow-inner">
        404
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The skill-swapping page or resource you are looking for does not exist or has been relocated.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/dashboard">
          <Button variant="primary" icon={Home}>
            Back to Dashboard
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" icon={Compass}>
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

