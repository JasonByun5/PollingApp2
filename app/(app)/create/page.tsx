'use client';

import {useState, useRef, useEffect} from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getImageValidationError } from '@/lib/uploads';
import { POLL_TYPES, type PollType } from '@/lib/poll-types';
import OptionCard from "../../../components/other/optionCard";


type PollOption = {
  index: number;
  title: string;
  description: string;
  imageUrl: string | null;
  file: File | null;
};

type User = {
  id: string;
  email: string;
};

function NewPoll(){
  const [pollTitle, setPollTitle] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [pollType, setPollType] = useState<PollType | ''>('');
  const [options, setOptions] = useState<PollOption[]>([]);
  const [currentOptionTitle, setCurrentOptionTitle] = useState('');
  const [currentOptionDesc, setCurrentOptionDesc] = useState('');
  const [currentOptionImage, setCurrentOptionImage] = useState<File | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  const [activeType, setActiveType] = useState<PollType | null>(null);
  const buttons = POLL_TYPES;

  //for the toast notif
  const [ alertMsg, setAlertMsg] = useState('');
  const[showAlert, setShowAlert] = useState(false);

  
  //for the popup
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [newPollId, setNewPollId] = useState<string | null>(null);



  const ShowCustomAlert = (msg: string) => {
    setAlertMsg(msg);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Supabase authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      const user = data?.claims;
      
      if (user) {
        setUser({
          id: user.sub,
          email: user.email || ''
        });
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);


  const handleRemoveOption = (index: number) => {
    setOptions(prev => prev.filter(opt => opt.index !== index));
  }

  const handleTrashOption = () =>{
    setCurrentOptionTitle('');
    setCurrentOptionDesc('');
    setCurrentOptionImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  } 

  const handleRemoveImage = () => {
    setCurrentOptionImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  } 

  const handleImageSelected = (file: File | null) => {
    if (!file) {
      setCurrentOptionImage(null);
      return;
    }

    const error = getImageValidationError(file);
    if (error) {
      ShowCustomAlert(error);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setCurrentOptionImage(file);
  }



  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOptionTitle.trim()) {
      ShowCustomAlert("Please enter a option title.");
      return;
    }

    let previewURL = null;
    if (currentOptionImage){
      previewURL = URL.createObjectURL(currentOptionImage);
    }

    const index = Date.now();

    setOptions(prev => [
      ...prev, 
      {
        index, 
        title: currentOptionTitle, 
        description: currentOptionDesc, 
        imageUrl: previewURL, 
        file: currentOptionImage
      }
    ]);

    setCurrentOptionTitle('');
    setCurrentOptionDesc('');
    setCurrentOptionImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitPoll = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    if (!pollTitle.trim()) {
      ShowCustomAlert("Please enter a poll title.");
      return;
    }
    if (!pollType) {
      ShowCustomAlert("Please select a poll type.");
      return;
    }
    if (options.length === 0) {
      ShowCustomAlert("Please add at least one option.");
      return;
    }

    setIsSubmitting(true); // Start loading

    if (!user) {
      ShowCustomAlert("User not authenticated.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      author: user.id,
      title: pollTitle,
      description: pollDescription,
      type: pollType,
      options: options.map((o) => ({
        name: o.title, 
        description: o.description
      })),
    };

    const formData = new FormData();
    
    formData.append("payload", JSON.stringify(payload));
    
    // Append files in order to match options array
    options.forEach((o, index) => {
      if (o.file) {
        formData.append("files", o.file);
      } else {
        // Append empty file if no file to maintain index alignment
        formData.append("files", new File([], ""));
      }
    });
  
    try{
      const res = await fetch("/api/polls", {
        method:"POST",
        body: formData,
      });

      if(!res.ok){
        throw new Error("Failed to create poll");
      }

      const data = await res.json(); //confgire a response from the backend if we want

      setNewPollId(data.pollId);
      setShowSuccess(true);
      
      setPollTitle('');
      setPollDescription('');
      setPollType('');
      setActiveType(null);
      setOptions([]);

    } catch (err) {
      ShowCustomAlert("Error submitting poll.");
      console.error(err);
    } finally {
      setIsSubmitting(false); // Stop loading regardless of success/failure
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p>You need to login to create a new poll.</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-red-200 text-black rounded hover:bg-red-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  return(
    <div>
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 text-center space-y-4">
            <h2 className="text-xl font-semibold text-red-300">Poll created!</h2>

            <p className="text-sm">
              <span className="font-medium">Poll&nbsp;ID:</span>
              <br />
              <span className="font-mono text-gray-700">{newPollId}</span>
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowSuccess(false);
                  router.push("/dashboard");
                }}
                className="bg-red-200 hover:bg-red-300 text-white px-3 py-1 rounded"
              >
                View my polls
              </button>

              <button
                onClick={() => setShowSuccess(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded"
              >
                Make another
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center p-10">
        <div className="w-3/5 bg-red-50 px-20 py-10 rounded-2xl flex flex-col shadow-md">
          
          {/*Form Questions*/}
          <form className="w-full rounded-lg mb-5 flex flex-col  gap-1"> 
            <h1 className='text-[22px] font-bold'>Poll Title / Question</h1>
            <input 
              type="text"
              placeholder="Type your question here"
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
              className='w-full border border-gray-300 rounded px-3 py-1 text-sm mb-5'
            />
            <h1 className='text-[22px] font-bold' >Description (optional)</h1>
            <textarea 
              placeholder="Brief Description (E.g. Explain the options"
              value={pollDescription}
              onChange={(e) => setPollDescription(e.target.value)}
              className='w-full h-20 border border-gray-300 rounded px-3 py-1 text-sm'
            />
          </form>
          
          {/*Poll Type*/}
          <div className='flex justify-between mb-5'>
            <h1 className='text-[22px] font-bold'> Poll Type: </h1>

            {buttons.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setActiveType(type)
                  setPollType(type)
                }}
                className={`rounded px-3 py-1 w-24 ${
                  activeType === type ?  'bg-red-300' : 'bg-red-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>


          {/*Options*/}
          <div className='flex flex-row'>

            {/*Option form*/}
            <div className='w-2/5 h-96 border border-gray-300 rounded-xl mr-10 py-5 overflow-y-auto'>
              <form className="w-full rounded-lg mb-5 flex flex-col items-center gap-1"  onSubmit={handleAddOption}>
                <h1 className='text-lg font-bold'>Option Name* </h1>
                <input 
                  type="text"
                  placeholder="Type your question here"
                  value={currentOptionTitle}
                  onChange={(e) => setCurrentOptionTitle(e.target.value)}
                  className='w-4/5 border border-gray-300 rounded px-3 py-1 text-sm mb-5'
                />
                <h1 className='text-lg font-bold' >Option Description</h1>
                <textarea 
                  placeholder="Brief Description (E.g. Explain the options)"
                  value={currentOptionDesc}
                  onChange={(e) => setCurrentOptionDesc(e.target.value)}
                  className='w-4/5 h-20 border border-gray-300  rounded px-3 py-1 text-sm mb-3'
                />

                

                <div className="flex gap-4">
                  {currentOptionImage ? (
                    <button 
                      type="button"
                      onClick={handleRemoveImage}
                      className="bg-red-200 p-2 rounded-full text-xl text-red-600 font-extrabold hover:bg-red-300"
                    >
                      ✕
                    </button>
                  ) : (
                    <>
                      <label htmlFor="file-upload" className="bg-red-200 p-2 rounded-full text-xl cursor-pointer hover:bg-red-300">
                        📤
                      </label>
                      <input 
                        id ="file-upload"
                        type="file"  
                        ref={fileInputRef}
                        accept="image/*" 
                        onChange={(e) => handleImageSelected(e.target.files?.[0] || null)}
                        className='hidden'
                      />
                    </>
                  )}

                  <button 
                    className="bg-red-200 p-2 rounded-full text-xl hover:bg-red-300"
                    type="button"
                    onClick={() => handleTrashOption()}
                  >🗑️</button>
                  <button 
                    type="submit" 
                    className="bg-red-200 p-2 rounded-full text-xl hover:bg-red-300"
                  >➕</button>
                </div>

              </form>
            </div>

            {/*Options existing*/}
            <div className='w-3/5 h-full' >
              <div className="grid grid-cols-2 gap-y-4">
                {options.map(option => (
                  <OptionCard key={option.index} option={option} onDelete={() => handleRemoveOption(option.index)}/>
              ))}
              </div>
            </div>
          </div>
          
          <div className="w-full flex justify-between">
            <div>
              {showAlert && (
                <div className=" bg-red-500 mt-4 text-white px-6 py-2 rounded shadow-lg z-50 transition-all">
                  {alertMsg}
                </div>
              )}
            </div>
            
            <button
              onClick={handleSubmitPoll}
              disabled={isSubmitting}
              className={`mt-4 px-4 py-2 text-white rounded transition-colors ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSubmitting ? 'Creating Poll...' : 'Submit Poll'}
            </button>

          </div>
          

        </div>
      </div>
    </div>
  )
}


export default NewPoll;