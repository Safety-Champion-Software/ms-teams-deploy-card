import { Octokit } from "@octokit/rest";
import moment from "moment-timezone";
import { WebhookBody } from "../models";
import { getInput } from "@actions/core";
import { CONCLUSION_THEMES } from "../constants";

export const OCTOCAT_LOGO_URL =
  "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";

export function formatCozyLayout(
  commit: Octokit.Response<Octokit.ReposGetCommitResponse>,
  status: string,
  elapsedSeconds?: number
) {
  const timezone = getInput("timezone") || "UTC";
  const nowFmt = moment()
    .tz(timezone)
    .format("dddd, MMMM Do YYYY, h:mm:ss a z");
  const webhookBody = new WebhookBody();
  const repoUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}`;
  const shortSha = process.env.GITHUB_SHA?.substr(0, 7);
  const statusUrl = `${repoUrl}/actions/runs/${process.env.GITHUB_RUN_ID}`;

  // Set status and elapsedSeconds
  let labels = `\`${status.toUpperCase()}\``;
  if (elapsedSeconds) {
    labels = `\`${status.toUpperCase()} [${elapsedSeconds}s]\``;
  }

  // Set environment name
  const environment = getInput("environment");
  if (environment.trim() !== "") {
    labels += ` \`ENV:${environment.toUpperCase()}\``;
  }

  // Set themeColor
  webhookBody.themeColor = CONCLUSION_THEMES[status] || "957DAD";

  const author = commit.data.author;
  // Set sections
  webhookBody.sections = [
    {
      activityTitle: `**CI #${process.env.GITHUB_RUN_NUMBER} (commit ${shortSha})** on [${process.env.GITHUB_REPOSITORY}](${repoUrl})`,
      activityImage: author?.avatar_url || OCTOCAT_LOGO_URL,
      activitySubtitle: author
        ? `by [@${author.login}](${author.html_url}) on ${nowFmt}`
        : nowFmt,
      activityText: `${labels} &nbsp; &nbsp; [View status](${statusUrl}) &nbsp; &nbsp; [Review diffs](${commit.data.html_url})`,
    },
  ];
  return webhookBody;
}