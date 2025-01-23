"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { cn, prompts } from "@/lib/utils";

import { generateImageWithRetry } from "@/lib/huggingface";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BotMessageSquare,
  Copy,
  CopyCheck,
  Download,
  ImageIcon,
  ImagesIcon,
  Loader2,
  SendHorizonal,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ToastContainer, toast } from "react-toastify";

type Images = {
  id: string;
  src: string;
  prompt: string;
};

let audio: HTMLAudioElement;

export default function Home() {
  const [images, setImages] = useState<Images[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [copy, setCopy] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController>(null);

  const maxImages = 20;
  const isMaxImages = images.length >= maxImages;

  useEffect(() => {
    const getImages = () => {
      const data = localStorage.getItem("images");
      return data ? JSON.parse(data) : [];
    };
    const data = getImages();
    setImages(data);
  }, []);

  useEffect(() => {
    localStorage.setItem("images", JSON.stringify(images));
  }, [images]);

  useEffect(() => {
    setIsMounted(true);
    audio = new Audio();
    audio.src = "/audio.mp3";
    audio.loop = false;
  }, []);

  if (!isMounted) {
    return null;
  }

  async function handleGenerate() {
    const inputValue = String(inputRef.current?.value).trim();

    if (!inputValue) {
      inputRef.current?.focus();
      inputRef.current!.value = "";
      return null;
    }

    audio.pause();
    audio.currentTime = 0;

    if (isMaxImages) {
      toast.warning(`You can generate up to ${maxImages} images.`, {
        onOpen: () => {
          audio.play();
          setIsLoading(false);
        },
      });
      return null;
    }

    console.clear();
    setIsLoading(true);

    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    const result = await generateImageWithRetry(
      {
        inputs: inputValue,
      },
      signal
    );

    if (result instanceof Blob) {
      const blob = result as Blob;
      const file = new File([blob], "image.jpeg", { type: blob.type });
      const fr = new FileReader();
      fr.readAsDataURL(file);
      fr.onload = () => {
        setImages((prev) => [
          {
            id: String(Date.now()),
            prompt: inputValue,
            src: String(fr.result),
          },
          ...prev,
        ]);
        toast.success("Image generated successfully.", {
          onOpen: () => {
            audio.play();
            setIsLoading(false);
          },
        });
      };
      return null;
    }

    if (!result?.ok && result?.name === "AbortError") {
      toast.info(result?.message, {
        onOpen: () => {
          audio.play();
          setIsLoading(false);
        },
      });
      return null;
    }

    if (!result?.ok) {
      toast.error(result?.message, {
        onOpen: () => {
          audio.play();
          setIsLoading(false);
        },
      });
      return null;
    }
  }

  return (
    <main className="flex flex-col min-h-screen">
      <div className="container flex flex-col mt-10 mb-10 md:mt-20">
        <div className="flex flex-col w-full max-w-lg space-y-4">
          <h1 className="relative text-2xl font-semibold sm:text-3xl md:text-4xl w-max">
            <strong className="text-primary">AI</strong> Image Generator
            <BotMessageSquare className="absolute -top-3 -right-7 size-6 text-primary" />
          </h1>

          <div className="flex flex-col items-center space-y-4">
            <Input
              ref={inputRef}
              type="search"
              disabled={isLoading}
              placeholder="Enter your prompt here..."
            />
            <Button
              className={`active:scale-95 w-full`}
              onClick={
                !isLoading
                  ? handleGenerate
                  : () => {
                      if (controllerRef.current) {
                        controllerRef.current.abort();
                        setIsLoading(false);
                      }
                    }
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <SendHorizonal />
                  <span>Generate</span>
                </>
              )}
            </Button>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Prompt Examples</AccordionTrigger>
              {prompts.map((prompt, index) => (
                <AccordionContent key={index} className="py-1">
                  <Button
                    onClick={() => {
                      inputRef.current!.value = prompt;
                      handleGenerate();
                    }}
                    size={"sm"}
                    variant={"link"}
                    disabled={isLoading}
                    className="p-0 m-0 text-sm text-left h-max"
                  >
                    {prompt}
                  </Button>
                </AccordionContent>
              ))}
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="container pb-10">
        <div className="flex mb-4 space-x-2 md:space-x-4">
          <span className="flex items-center px-4 py-2 space-x-1 rounded-md shadow select-none h-9 bg-primary/10 text-primary">
            {images.length <= 1 ? <ImageIcon /> : <ImagesIcon />}
            <span className="font-semibold">{images.length}</span>
          </span>

          <Button
            onClick={() => {
              confirm("Are you sure you want to clear all images?") &&
                setImages([]);
            }}
            size={"default"}
            variant={"destructive"}
            disabled={isLoading || images.length < 1}
          >
            <Trash2 />
            Clear All
          </Button>
        </div>

        <div
          className={cn(
            "grid grid-cols-2 gap-4 xl:grid-cols-4 2xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2 place-items-center",
            {
              "grid-cols-1 place-items-start": images.length <= 0,
            }
          )}
        >
          {isLoading && (
            <Skeleton
              className={cn("size-full bg-primary/30 rounded", {
                "size-[156px] sm:size-[256px]": images.length <= 0,
              })}
            ></Skeleton>
          )}

          {images.map((image) => (
            <Dialog key={image.id}>
              <DialogTrigger className="overflow-hidden rounded shadow shadow-gray-500">
                <Image
                  src={image.src}
                  width={512}
                  height={512}
                  alt={image.prompt}
                  className="w-full duration-300 hover:scale-110"
                />
              </DialogTrigger>
              <DialogContent className="w-full max-w-3xl">
                <DialogHeader>
                  <DialogTitle></DialogTitle>
                  <DialogDescription></DialogDescription>
                </DialogHeader>

                <Image
                  src={image.src}
                  width={512}
                  height={512}
                  alt={image.prompt}
                  className="w-full"
                />

                <DialogDescription className="h-full overflow-y-auto max-h-32">
                  {image.prompt}
                </DialogDescription>

                <DialogFooter>
                  <div className="flex items-center justify-end w-full space-x-2">
                    <Button
                      size={"sm"}
                      variant={"outline"}
                      onClick={() => {
                        navigator.clipboard.writeText(image.prompt).then(() => {
                          setCopy(true);
                          const timer = setTimeout(() => {
                            setCopy(false);
                          }, 1000);

                          return () => clearTimeout(timer);
                        });
                      }}
                    >
                      {copy ? (
                        <CopyCheck className="text-green-500" />
                      ) : (
                        <Copy />
                      )}
                    </Button>

                    <Button
                      size={"sm"}
                      variant={"outline"}
                      onClick={() => {
                        const link = document.createElement("a");
                        link.download = "image.jpeg";
                        link.href = image.src;
                        link.click();
                      }}
                    >
                      <Download />
                    </Button>

                    <Button
                      size={"sm"}
                      variant={"destructive"}
                      onClick={() => {
                        confirm(
                          "Are you sure you want to delete this image?"
                        ) &&
                          setImages((prev) =>
                            prev.filter((item) => item.id !== image.id)
                          );
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
      <ToastContainer />
    </main>
  );
}
