studio-5737344635:~/studio{main}$ git status
On branch main
Your branch is ahead of 'origin/main' by 8 commits.
  (use "git push" to publish your local commits)

nothing to commit, working tree clean
studio-5737344635:~/studio{main}$ git add
Nothing specified, nothing added.
hint: Maybe you wanted to say 'git add .'?
hint: Disable this message with "git config advice.addEmptyPathspec false"
studio-5737344635:~/studio{main}$ git commit
On branch main
Your branch is ahead of 'origin/main' by 8 commits.
  (use "git push" to publish your local commits)

nothing to commit, working tree clean
studio-5737344635:~/studio{main}$ ~/.ssh/id_rsa.pub
bash: /home/user/.ssh/id_rsa.pub: No such file or directory
studio-5737344635:~/studio{main}$ ~/.ssh/id_ed25519.pub
bash: /home/user/.ssh/id_ed25519.pub: No such file or directory
studio-5737344635:~/studio{main}$ ssh -T git@github.com
ssh is not installed, but available in the following packages, pick one to run it, Ctrl+C to cancel.
The authenticity of host 'github.com (20.27.177.113)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? 
Host key verification failed.
To permanently add this package to your environment, please add pkgs.openssh to the list of packages in your dev.nix file, then rebuild your environment
studio-5737344635:~/studio{main}$ git remote set-url origin git@github.com:ranasagar/peakpulsenp.git
studio-5737344635:~/studio{main}$ git remote -v
origin  git@github.com:ranasagar/peakpulsenp.git (fetch)
origin  git@github.com:ranasagar/peakpulsenp.git (push)
studio-5737344635:~/studio{main}$ git config credential.helper ""
studio-5737344635:~/studio{main}$ git config --global credential.helper ""
studio-5737344635:~/studio{main}$ git push origin main
The authenticity of host 'github.com (20.27.177.113)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? y
Please type 'yes', 'no' or the fingerprint: yes
Warning: Permanently added 'github.com' (ED25519) to the list of known hosts.
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.