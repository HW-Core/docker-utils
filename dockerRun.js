const args = process.argv.slice(2);

const { execSync } = require('child_process');

/**
 * @param {Object} options - configuration object
 * @param {String} options.service - name of service where execute commands 
 * @param {Boolean} options.hasDb - if true, enable some db checks
 */
async function main({
    service = "node-server",
    hasDb = true
}) {
    const command = args.shift();

    var options = []

    for (var i = 0; i < args.length; i++) {
        if (args[i].startsWith("-")) {
            options.push(args[i]);
        } else {
            break;
        }
    }

    var cmd = "";

    var scArgs = args.slice(i);

    var upArgs = "", exitArgs = "true";

    if (options.includes("--prod") || options.includes("-p")) {
        upArgs = " -f docker-compose.override.yml -f docker-compose.prod.yml ";
    }

    if (options.includes("--rm") || options.includes("-r")) {
        exitArgs = " docker-compose down"
    } else if (options.includes("--stop") || options.includes("-s")) {
        exitArgs = " docker-compose stop"
    }

    const dockerUp = "docker-compose up -d " + upArgs + (hasDb ? " && docker-compose exec db /apps/docker/waitForMySQL.sh" : "")

    switch (command) {
        case "docker:fg":
            if (scArgs.length > 0) {
                cmd = dockerUp + " && docker-compose exec " + service + " npm run " + scArgs + " || " + exitArgs
            } else {
                cmd = "docker-compose up " + upArgs + " || " + exitArgs
            }

            break;
        case "docker:bg":
            cmd = dockerUp + " && docker-compose exec " + service + " npm run " + scArgs + " || " + exitArgs
            break;
        case "docker:shell":
            cmd = dockerUp + " && docker-compose exec " + service + " bash || " + exitArgs
            break;
        case "docker:remove":
            cmd = "docker-compose down || true"
            break;
        case "docker:stop":
            cmd = "docker-compose stop || true"
            break;
        default:
            cmd = "npm run " + command + " " + args.join(" ") + " || true"
            break;
    }

    console.log("Running: " + cmd)

    execSync(cmd, { stdio: 'inherit' });
}

module.exports = main;

