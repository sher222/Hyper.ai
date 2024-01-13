/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import React from 'react';
import logo from "./logo_resized.png"


const MODAL_ENDPOINT =
  "https://thecodingwizard--stable-diffusion-xl-app.modal.run";

type AdMetadata = {
  idea: string;
  music: string;
  text: string;
  "video-prompt": string;
};

const UserAd = ({
  metadata,
  userNum,
}: {
  metadata: AdMetadata;
  userNum: number;
}) => {
  const [sceneImage, setSceneImage] = useState<string | null>(null);

  const generateVideo = async (metadata: AdMetadata) => {
    setSceneImage("");
    const res = await fetch(
      `${MODAL_ENDPOINT}/infer/${metadata["video-prompt"]}`
    );

    const blob = await res.blob();
    setSceneImage(URL.createObjectURL(blob));
  };

  useEffect(() => {
    generateVideo(metadata);
  }, [metadata]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">User {userNum + 1}</h2>
      <div>
        {sceneImage !== null && (
          <div>
            <div className="aspect-square flex items-center justify-center rounded-md bg-gray-50">
              {sceneImage === "" ? (
                <span>Generating Image...</span>
              ) : (
                <img
                  className="mx-auto rounded-md"
                  src={sceneImage}
                  alt="generated scene"
                />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="text-gray-600 mt-3 text-sm">{metadata.idea}</div>

      <div className="h-3"></div>

      <button
        className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        onClick={() => generateVideo(metadata)}
      >
        Regenerate
      </button>
    </div>
  );
};

export  function NavBar(){
  return (
    <nav className="bg-white border-gray-200 dark:bg-gray-900" style={{position: "fixed", top: "0", width: "100%"}}>
    <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4"> 
      <a className="flex items-center space-x-3 rtl:space-x-reverse">
        <img src={logo.src} alt="Logo" style={{height: 70}} />
      </a>
      <div className="hidden w-full md:block md:w-auto" id="navbar-default">
        <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
          <li>
            <a href="#" aria-current="page" style={{color: "white", fontSize: 18}}>Home</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>  
  )
}
export default function HomeWrapper(){
  return (
    <div>
      <NavBar/>
      <div className="block py-2 px-3 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 dark:text-white md:dark:text-blue-500" style={{paddingTop: 100}}>
        <Home/>
      </div>
    </div>
  )
}
export function Home() {
  const [adGoal, setAdGoal] = useState(
    "download the app sage which is a shopping agent that helps people easily shop and find personalized items"
  );
  const [userInfoFile, setUserInfoFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<AdMetadata[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleSubmit = async () => {
    setGenerating(true);
    const reader = new FileReader();

    reader.addEventListener(
      "load",
      async () => {
        const text = reader.result;

        const res = await fetch(`${MODAL_ENDPOINT}/metadata/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_info_csv: text,
            user_goal: adGoal,
          }),
        });

        const resp = await res.json();
        setMetadata(resp);
        setGenerating(false);
      },
      false
    );

    reader.readAsText(userInfoFile as Blob);
  };

  return (
    <div className="px-8 pb-64">
      <div className="max-w-prose mx-auto">
        <h1 className="mt-20 text-3xl font-bold text-indigo-600">Generate advertisements</h1>
        <form
          className="mt-8 space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="">
            <label
              htmlFor="goal"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Advertisement Goal
            </label>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              What&apos;s the goal of this advertisement?
            </p>
            <div className="mt-2">
              <textarea
                id="goal"
                name="goal"
                rows={3}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={adGoal}
                onChange={(e) => setAdGoal(e.target.value)}
              />
            </div>
          
          </div>
          <div className="">
            <label
              htmlFor="cover-photo"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              User Information
            </label>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Upload a csv file for every user you want a video generated for
            </p>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-indigo-600/25 px-6 py-10">
              <div className="text-center">
                <div className="flex text-sm leading-6 text-gray-600">
                  {userInfoFile ? (
                    <p>{userInfoFile.name}</p>
                  ) : (
                    <>
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span className="text-indigo-600">Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUserInfoFile(file);
                            }
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Generate!
            </button>
          </div>
        </form>
      </div>

      <div className="h-16"></div>
      {generating && metadata === null && (
        <div className="text-xl font-bold text-center">
          Generating user metadata...
        </div>
      )}
      <div className="grid grid-cols-5 gap-x-8">
        {metadata !== null &&
          metadata.map((user, i) => (
            <UserAd metadata={user} key={i} userNum={i} />
          ))}
      </div>
    </div>
  );
}
