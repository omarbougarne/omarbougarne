const fs = require('fs');
const path = require('path');
const axios = require('axios');

const readmePath = path.join(process.cwd(), 'README.md');

async function fetchGitHubData() {
  const username = 'omarbougarne'; // Your GitHub username
  
  try {
    // Get user data
    const userResponse = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
      },
    });
    
    // Get repositories
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Authorization: process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
      },
    });
    
    // Calculate stats
    const publicRepos = reposResponse.data.length;
    const totalStars = reposResponse.data.reduce((acc, repo) => acc + repo.stargazers_count, 0);
    
    // Get languages used across repos
    const languages = new Set();
    reposResponse.data.forEach(repo => {
      if (repo.language) languages.add(repo.language);
    });
    
    return {
      publicRepos,
      totalStars,
      languages: Array.from(languages),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return {
      publicRepos: '?',
      totalStars: '?',
      languages: [],
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }
}

async function updateReadme() {
  try {
    let readme = fs.readFileSync(readmePath, 'utf8');
    
    const { publicRepos, totalStars, languages, lastUpdated } = await fetchGitHubData();
    
    // Update placeholders in the README
    readme = readme.replace('<!-- GITHUB_REPOS -->', publicRepos);
    readme = readme.replace('<!-- GITHUB_STARS -->', totalStars);
    readme = readme.replace('<!-- GITHUB_CONTRIBUTIONS -->', 'Updated daily');
    readme = readme.replace('<!-- LAST_UPDATED -->', lastUpdated);
    
    // Update languages in Tech Stack
    const techStack = `- Frontend: React, React Native
- Backend: Node.js, Express
- Database: MongoDB
- Languages: ${languages.join(', ')}
- Tools: Git, VS Code, Linux`;
    
    readme = readme.replace(/<!-- TECH_STACK -->[\s\S]*?(?=\n\n|$)/, `<!-- TECH_STACK -->\n${techStack}`);
    
    fs.writeFileSync(readmePath, readme);
    console.log('README updated successfully!');
  } catch (error) {
    console.error('Error updating README:', error);
  }
}

updateReadme();