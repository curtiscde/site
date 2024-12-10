import React from "react"

export const Footer = () => {
  return (
    <>
      <div className="bg-neutral mt-16">
        <div className="container mx-auto">
          <footer className="footer text-neutral-content p-10">
            <nav>
              <h6 className="footer-title">Social</h6>
              <a className="link link-hover" href="https://www.linkedin.com/in/curtis-timson-89040a37/" target="_blank">LinkedIn</a>
              <a className="link link-hover" href="https://bsky.app/profile/curtiscode.dev" target="_blank">Bluesky</a>
              <a className="link link-hover" href="https://stackoverflow.com/users/370103/curtis" target="_blank">StackOverflow</a>
              <a className="link link-hover" href="https://github.com/curtiscde" target="_blank">GitHub</a>
            </nav>
            <nav>
              <h6 className="footer-title">Company</h6>
              <a className="link link-hover">About us</a>
              <a className="link link-hover">Contact</a>
              <a className="link link-hover">Jobs</a>
              <a className="link link-hover">Press kit</a>
            </nav>
            <nav>
              <h6 className="footer-title">Legal</h6>
              <a className="link link-hover">Terms of use</a>
              <a className="link link-hover">Privacy policy</a>
              <a className="link link-hover">Cookie policy</a>
            </nav>
          </footer>
        </div>
      </div>
    </>
  )
}