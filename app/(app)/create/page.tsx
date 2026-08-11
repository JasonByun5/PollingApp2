'use client';

import {useState, useRef, useEffect} from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getImageValidationError } from '@/lib/uploads';
import { POLL_TYPES, type PollType } from '@/lib/poll-types';
import OptionCard from "../../../components/other/optionCard";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

  const [ alertMsg, setAlertMsg] = useState('');
  const[showAlert, setShowAlert] = useState(false);

  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [newPollId, setNewPollId] = useState<string | null>(null);

  const ShowCustomAlert = (msg: string) => {
    setAlertMsg(msg);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setIsSubmitting(true);

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
    
    options.forEach((o) => {
      if (o.file) {
        formData.append("files", o.file);
      } else {
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

      const data = await res.json();

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
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <PageShell size="md">
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-semibold text-foreground">Authentication required</h2>
          <p className="text-muted-foreground">You need to log in to create a new poll.</p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </PageShell>
    );
  }

  return(
    <div>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
          <div className="w-80 space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-[0_8px_30px_rgba(26,31,54,0.12)]">
            <h2 className="text-xl font-semibold text-foreground">Poll created</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Poll ID</span>
              <br />
              <span className="font-mono text-foreground">{newPollId}</span>
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setShowSuccess(false);
                  router.push("/dashboard");
                }}
              >
                View my polls
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowSuccess(false)}
              >
                Make another
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageShell size="xl">
        <PageHeader
          title="Create a poll"
          description="Add a title, choose a type, and build your options."
        />

        <form className="mb-8 flex w-full flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="poll-title">Poll title / question</Label>
            <Input
              id="poll-title"
              type="text"
              placeholder="Type your question here"
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poll-description">Description (optional)</Label>
            <textarea
              id="poll-description"
              placeholder="Brief description of the options"
              value={pollDescription}
              onChange={(e) => setPollDescription(e.target.value)}
              className="flex min-h-20 w-full rounded-[6px] border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </form>

        <div className="mb-8 space-y-3">
          <Label>Poll type</Label>
          <div className="flex flex-wrap gap-2">
            {buttons.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setActiveType(type)
                  setPollType(type)
                }}
                className={cn(
                  "rounded-[6px] border px-4 py-2 text-sm font-medium transition-colors",
                  activeType === type
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full rounded-lg border border-border bg-background p-5 lg:w-2/5">
            <form className="flex flex-col gap-4" onSubmit={handleAddOption}>
              <div className="space-y-2">
                <Label htmlFor="option-title">Option name*</Label>
                <Input
                  id="option-title"
                  type="text"
                  placeholder="Option title"
                  value={currentOptionTitle}
                  onChange={(e) => setCurrentOptionTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="option-desc">Option description</Label>
                <textarea
                  id="option-desc"
                  placeholder="Brief description"
                  value={currentOptionDesc}
                  onChange={(e) => setCurrentOptionDesc(e.target.value)}
                  className="flex min-h-20 w-full rounded-[6px] border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {currentOptionImage ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                  >
                    Remove image
                  </Button>
                ) : (
                  <>
                    <Label
                      htmlFor="file-upload"
                      className="inline-flex h-8 cursor-pointer items-center rounded-[6px] border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                    >
                      Upload image
                    </Label>
                    <input
                      id="file-upload"
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => handleImageSelected(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTrashOption()}
                >
                  Clear
                </Button>
                <Button type="submit" size="sm">
                  Add option
                </Button>
              </div>
            </form>
          </div>

          <div className="w-full lg:w-3/5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {options.map(option => (
                <OptionCard key={option.index} option={option} onDelete={() => handleRemoveOption(option.index)}/>
              ))}
              {options.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">
                  No options yet. Add one to get started.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex w-full items-center justify-between gap-4">
          <div>
            {showAlert && (
              <div className="rounded-[6px] bg-destructive px-4 py-2 text-sm text-destructive-foreground shadow-sm">
                {alertMsg}
              </div>
            )}
          </div>
          <Button
            onClick={handleSubmitPoll}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating poll...' : 'Submit poll'}
          </Button>
        </div>
      </PageShell>
    </div>
  )
}

export default NewPoll;
