---
title: Gemini Co-Drawing
emoji: ✏️
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
license: apache-2.0
app_port: 3000
short_description: 'Gemini 2.0 native image generation co-doodling'
---

# Gemini Co-Drawing (Vercel Version)

A collaborative drawing application powered by Google's Gemini 2.0 API for image generation. This app allows users to create drawings and have Gemini enhance or add to them based on text prompts.

## Features

- Interactive canvas for drawing
- Color picker for customizing your drawings
- Text prompt interface to instruct Gemini on what to add
- Real-time image generation using Gemini 2.0

## Technology Stack

This is a [Next.js](https://nextjs.org) project that uses:
- Next.js for the frontend and API routes
- Google's Gemini 2.0 API for image generation
- Canvas API for drawing functionality


## Deploying to Vercel

This app can be easily deployed to Vercel:

1. Fork or clone this repository to your GitHub account
2. Connect your GitHub repository to Vercel
3. Deploy the application
4. No environment variables are required as users will input their own API key

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcdpath%2Fgemini-codrawing-vercel)


## Getting Started

1. Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. When you first access the application, you'll be prompted to enter your API key
3. Your API key will be stored in your browser's local storage for future use
4. You can update your API key anytime by clicking the key icon in the toolbar
