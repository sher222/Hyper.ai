/* eslint-disable @next/next/no-img-element */
"use client";

import { PhotoIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

const MODAL_ENDPOINT =
  "https://thecodingwizard--stable-diffusion-xl-app.modal.run";

export default function Home() {
  const [userInfo, setUserInfo] = useState(
    "The user is an 18-23 year old living in Cupertino, California."
  );
  const [adGoal, setAdGoal] = useState(
    "Get the user to be more excited to go to the gym."
  );

  const [sceneImage, setSceneImage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSceneImage("");
    const res = await fetch(`${MODAL_ENDPOINT}/infer/${userInfo}`);

    const blob = await res.blob();
    setSceneImage(URL.createObjectURL(blob));
  };

  return (
    <div className="px-4 pb-64">
      <div className="max-w-prose mx-auto">
        <h1 className="mt-20 text-3xl font-bold">Placeholder Name</h1>
        <form
          className="mt-8 space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="">
            <label
              htmlFor="user_info"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              User Information
            </label>
            <div className="mt-2">
              <textarea
                id="user_info"
                name="user_info"
                rows={3}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={userInfo}
                onChange={(e) => setUserInfo(e.target.value)}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Demographic information about the user we are trying to target
            </p>
          </div>
          <div className="">
            <label
              htmlFor="goal"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Advertisement Goal
            </label>
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
            <p className="mt-3 text-sm leading-6 text-gray-600">
              What&apos;s the goal of this advertisement?
            </p>
          </div>
          <div className="">
            <label
              htmlFor="cover-photo"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Cover photo
            </label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
              <div className="text-center">
                <PhotoIcon
                  className="mx-auto h-12 w-12 text-gray-300"
                  aria-hidden="true"
                />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">
                  PNG or JPG up to 10MB
                </p>
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

        {sceneImage !== null && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Generated Scene</h2>
            {sceneImage === "" ? (
              <div>Generating...</div>
            ) : (
              <img
                className="mx-auto rounded-md"
                src={sceneImage}
                alt="generated scene"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
