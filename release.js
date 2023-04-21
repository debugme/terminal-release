const shell = require('shelljs');
const bumpVersion = require('semver-increment');
const { format } = require('date-fns');
const chalk = require('chalk');

const checkOnMain = () => {
  const command = 'git branch --show-current';
  const { stdout, stderr } = shell.exec(command, { silent: true });
  if (stderr) {
    console.error(chalk.red('[error] unable to get current branch name'), stderr);
    process.exit(0);
  }
  const branchName = stdout.trim();
  if (branchName !== 'main') {
    console.error(chalk.red('[error] please switch to main branch'), stderr);
    process.exit(0);
  }
};

const refreshTags = () => {
  const command = 'git fetch --all --tags';
  const { stderr } = shell.exec(command, { silent: true });
  if (stderr) {
    console.error(chalk.red('[error] unable to get latest tags'), stderr);
    process.exit(0);
  }
};

const getCurrentTag = () => {
  const command = 'git describe --tags --abbrev=0 2>/dev/null';
  const { stdout, stderr } = shell.exec(command, { silent: true });
  if (stderr) {
    console.error(chalk.red('[error] unable to get current tag'), stderr);
    process.exit(0);
  }
  const currentTag = stdout.trim();
  return currentTag;
};

const getProposedTag = currentTag => {
  const bumpType = process.argv[2] || 'patch';
  const majorMask = Number(bumpType === 'major');
  const minorMask = Number(bumpType === 'minor');
  const patchMask = Number(bumpType === 'patch');
  const bumpPatchOnly = [majorMask, minorMask, patchMask];
  const proposedTag = `${bumpVersion(bumpPatchOnly, currentTag)}`;
  return proposedTag;
};

const getReleaseCommand = proposedTag => {
  const generateNotes = '--generate-notes';
  const date = format(new Date(), 'MM/dd/yyyy');
  const title = `--title "[${proposedTag}] ${date}"`;
  const latest = '--latest';
  const draft = '--draft';
  const command = `gh release create ${proposedTag} ${title} ${generateNotes} ${latest} ${draft}`;
  return command;
};

const runReleaseCommand = command => {
  const { stdout, stderr } = shell.exec(command, { silent: true });
  if (stderr) {
    console.error(chalk.red('[error] unable to trigger release'), stderr);
    process.exit(0);
  }
  return stdout.trim();
};

const info = (label, value) => {
  const text = `${chalk.yellow('[info]')} ${chalk.yellow(label)}? ${chalk.yellow(value)}`;
  console.info(text);
};

const main = () => {
  checkOnMain();
  refreshTags();

  const currentTag = getCurrentTag();
  info('currentTag', currentTag);

  const proposedTag = getProposedTag(currentTag);
  info('proposedTag', proposedTag);

  const releaseCommand = getReleaseCommand(proposedTag);
  info('releaseCommand', releaseCommand);

  const releaseStatus = runReleaseCommand(releaseCommand);
  info('releaseStatus', releaseStatus);
};

main();

