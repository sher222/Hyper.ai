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
  name: string;
};

const UserAd = ({
  metadata,
  userNum,
  companyName,
  companyDescription,
}: {
  metadata: AdMetadata;
  userNum: number;
  companyName: string;
  companyDescription: string;
}) => {
  const [sceneImage, setSceneImage] = useState<string | null>(null);

  const generateVideo = async (metadata: AdMetadata) => {
    setSceneImage("");
    const res = await fetch(
      `${MODAL_ENDPOINT}/infer/${metadata["video-prompt"]}`
    );
    const call_id = ((await res.json()) as any).call_id;

    const try_get = async () => {
      let song, artist;
      if (metadata.music.split(": ").length == 2) {
        song = metadata.music.split(": ")[0];
        artist = metadata.music.split(": ")[1];
      } else {
        song = "";
        artist = "";
      }
      const res = await fetch(`${MODAL_ENDPOINT}/result/${call_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption: metadata.text,
          company_name: companyName,
          company_description: companyDescription,
          song_title: song,
          artist: artist,
        }),
      });
      if (res.status === 202) {
        // still loading
        setTimeout(try_get, 5000);
      } else if (res.status === 200) {
        const blob = await res.blob();
        setSceneImage(URL.createObjectURL(blob));
      } else {
        console.error("failed to fetch");
        console.error(res);
      }
    };

    setTimeout(try_get, 5000);
  };

  useEffect(() => {
    generateVideo(metadata);
  }, [metadata]);

  return (
    <div className="block max-w-sm p-6 m-0 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100">
      <h2 className="text-xl font-bold mb-2">{metadata.name}</h2>
      <div>
        {sceneImage !== null && (
          <div>
            <div className="aspect-[1024/576] flex items-center justify-center rounded-md bg-gray-50">
              {sceneImage === "" ? (
                // <span>Generating Image...</span>
                // <div role="status" className="absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2">
                <div>
        <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
        <span className="sr-only">Loading...</span>
        </div>
    // </div>
              ) : (
                <video
                  className="mx-auto rounded-md"
                  src={sceneImage}
                  autoPlay
                  loop
                  controls
                />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-1 text-sm">{metadata.text}</div>
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
      <div className="block py-2 px-3 text-white bg-indigo-800 rounded md:bg-transparent md:text-indigo-800 md:p-0 dark:text-white md:dark:text-indigo-800" style={{paddingTop: 100}}>
        <Home/>
      </div>
    </div>
  )
}
export function Home() {
  const [companyName, setCompanyName] = useState("Sage");
  const [companyDescription, setCompanyDescription] = useState("Shop Smarter");
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
        <h1 className="mt-20 text-3xl font-bold text-indigo-800">Generate advertisements</h1>
        <form
          className="mt-8 space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="">
            <label
              htmlFor="company_name"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Company Name
            </label>
            <div className="mt-2">
              <input
                id="company_name"
                name="company_name"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>
          <div className="">
            <label
              htmlFor="company_desc"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Company Slogan
            </label>
            <div className="mt-2">
              <input
                id="company_desc"
                name="company_desc"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
              />
            </div>
          </div>
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
              className="rounded-md bg-indigo-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Generate!
            </button>
          </div>
        </form>
      </div>

      <div className="h-16"></div>
      {(generating || metadata !== null) && (
            <hr className="h-px my-8 bg-gray-200 border-0 dark:bg-gray"/>
      )}
      {generating && metadata === null && (
        
        <div className="text-xl font-bold text-center">
          Generating content...
        </div>
      )}
      <div className="grid grid-cols-3 gap-x-8 gap-y-8">
        {metadata !== null &&
          metadata.map((user, i) => (
            <UserAd
              metadata={user}
              key={i}
              userNum={i}
              companyName={companyName}
              companyDescription={companyDescription}
            />
          ))}
      </div>
    </div>
  );
}
