const { execSync } = require('child_process');

const components = [
  'card',
  'input',
  'avatar',
  'sonner',
  'dropdown-menu',
  'separator',
  'form',
  'label',
  'select',
  'tabs',
  'popover'
];

// Set npm config for legacy-peer-deps first
execSync('npm config set legacy-peer-deps true', { stdio: 'inherit' });

// Install each component one by one
components.forEach(component => {
  console.log(`Installing ${component}...`);
  try {
    // Windows PowerShell doesn't support the bash process substitution syntax
    // We'll just run the command and let the user select option 2 manually
    execSync(`npx shadcn@latest add ${component}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error installing ${component}:`, error.message);
  }
}); 