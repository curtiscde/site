interface Config {
  pageTitle: string
  postsPerPage: number
  rssFeedDescription: string
  subtitle: string
  title: string
  url: string
  socialLinks: {
    x: string
    bluesky: string
    github: string
    stackoverflow: string
    linkedin: string
    rss: string
  }
}

export const config: Config = {
  pageTitle: 'Curtis Timson | Software Engineer',
  postsPerPage: 20,
  rssFeedDescription: 'The Curtis Timson Blog',
  subtitle: "Software Engineer",
  title: "Curtis Timson",
  url: 'https://www.curtiscode.dev',
  socialLinks: {
    x: 'https://x.com/curtcode',
    bluesky: 'https://bsky.app/profile/curtiscode.dev',
    stackoverflow: 'https://stackoverflow.com/users/370103/curtis',
    github: 'https://github.com/curtiscde',
    linkedin: 'https://www.linkedin.com/in/curtis-timson-89040a37/',
    rss: '/rss.xml'
  }
};
