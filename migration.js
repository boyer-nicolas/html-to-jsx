// Read script params
import prettier from 'prettier';
import HTMLtoJSX from 'htmltojsx';
import fs from 'fs';
import { exec } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import { exit } from 'process';
import HTMLParser from 'node-html-parser';
import fse from 'fs-extra';
import { JSDOM } from 'jsdom';

const viteFolder = "./vite";
const processName = process.argv[2];
const conversionFolder = "./jsx";
const assetsFolder = conversionFolder + "/Assets";
const pagesFolder = conversionFolder + "/Pages";
const layoutsFolder = conversionFolder + "/Layouts";
const componentsFolder = conversionFolder + "/Components";
const assetsDist = "/Assets";
const pagesDist = "/Pages";
const layoutsDist = "/Layouts";
const componentsDist = "/Components";

function load(message)
{
    return ora(`${chalk.cyanBright(message)}`).start();
}

function log(message)
{
    console.log(chalk.cyanBright("[MIGRATION] ") + message);
}

function execute(command, callback)
{
    exec(command, function (error, stdout, stderr) { callback(stdout); });
};

let checkHtml = load("Checking for HTML files");
// Check if there are any .html files in the current directory
const files = fs.readdirSync("./");
let filesExist = false;
for (let i = 0; i < files.length; i++)
{
    const fileName = files[i];
    const fileExtension = fileName.split(".").pop();

    if (fileExtension === "html")
    {
        filesExist = true;
        break;
    }
}

if (!filesExist)
{
    checkHtml.fail("No HTML files found");
    exit
}
else
{
    checkHtml.succeed("Found HTML files");
}

if (!processName)
{
    log('Usage: node migration.js <process?function,class>')
    process.exit(1)
}

let componentDidMountJs = "";
let componentDidMountPage = "";

log("Starting migration process: " + processName);
let functionName;

function createFunction(fileName, name)
{
    let createLoader = load("Creating " + name + " function");
    if (name !== undefined && name !== null)
    {
        functionName = name;
    }
    else if (fileName !== undefined)
    {
        functionName = fileName.split("-").map((word, index) =>
        {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join("");

        if (functionName === "404")
        {
            functionName = "NotFound";
        }
        else if (functionName === "500")
        {
            functionName = "InternalError";
        }
        else if (functionName === "403")
        {
            functionName = "Unauthorized";
        }
    }
    else
    {
        functionName = "Unknown";
    }

    createLoader.succeed("Created " + functionName + " function");

    return functionName;
}

function createFunctionStart(name, pageTitle)
{
    let createFunctionStartLoader = load("Creating " + name + " function start");
    let appendTitle = 0;
    if (pageTitle !== undefined && pageTitle !== null)
    {
        appendTitle = 1;
    }

    if (processName === "function")
    {

        var JSXFunctionStart = "export default function " + name + "() {\n";

        if (appendTitle === 1)
        {
            JSXFunctionStart += "    document.title = \"" + pageTitle + "\";\n";
        }

        if (componentDidMountPage !== undefined && componentDidMountPage !== null)
        {
            if (componentDidMountPage.includes("undefined"))
            {
                componentDidMountPage = componentDidMountPage.replace("undefined", "");
            }

            JSXFunctionStart += componentDidMountPage;
        }

        JSXFunctionStart += "    return (\n";
    }
    else
    {
        var JSXFunctionStart = "import React from 'react';\n";
        JSXFunctionStart += "export default class " + name + " extends React.Component {\n";
        JSXFunctionStart += "    constructor(props) {\n";
        JSXFunctionStart += "        super(props);\n";
        JSXFunctionStart += "        this.props = props;\n";
        JSXFunctionStart += "    }\n\n";
        JSXFunctionStart += "    componentDidMount() {\n";

        if (appendTitle === 1)
        {
            JSXFunctionStart += "        document.title = \"" + pageTitle + "\";\n";
        }

        if (componentDidMountPage !== undefined && componentDidMountPage !== null)
        {
            JSXFunctionStart += componentDidMountPage;
        }

        JSXFunctionStart += "    }\n\n";
        JSXFunctionStart += "    render() {\n";
        JSXFunctionStart += "    return (\n";
    }

    createFunctionStartLoader.succeed("Created " + name + " function start");

    return JSXFunctionStart;
}

function createFunctionEnd()
{
    let createFunctionEndLoader = load("Creating " + functionName + " function end");
    if (processName === "function")
    {
        var JSXFunctionEnd = "    );\n";
        JSXFunctionEnd += "}\n";
    }
    else
    {
        var JSXFunctionEnd = "    );\n";
        JSXFunctionEnd += "}\n";
        JSXFunctionEnd += "}";
    }

    createFunctionEndLoader.succeed("Created " + functionName + " function end");

    return JSXFunctionEnd;
}

let HeaderContents, FooterContents, SidebarContents;

if (fs.existsSync(conversionFolder))
{
    fse.removeSync(conversionFolder);
}

fs.mkdirSync(conversionFolder);

// Clear and create assets folder
if (fs.existsSync(assetsFolder))
{
    let clearAssetsLoad = load("Clearing assets folder");
    fs.rmSync(assetsFolder, { recursive: true }, (err) =>
    {
        if (err)
        {
            clearAssetsLoad.fail("Failed to clear assets folder");
            throw err;
        }
    });
    clearAssetsLoad.succeed("Cleared assets folder");
}
fs.mkdirSync(assetsFolder);

// Clear and create pages folder
let clearPagesLoad = load("Clearing pages folder");
if (fs.existsSync(pagesFolder))
{
    fs.rmSync(pagesFolder, { recursive: true }, (err) =>
    {
        if (err)
        {
            clearPagesLoad.fail("Failed to clear pages folder");
            throw err;
        }
    });
}

clearPagesLoad.succeed("Cleared pages folder");


fs.mkdirSync(pagesFolder);

// Clear and create layouts folder
if (fs.existsSync(layoutsFolder))
{
    fs.rmSync(layoutsFolder, { recursive: true });
}

fs.mkdirSync(layoutsFolder);

function isComponent(html)
{
    return html.includes("header") || html.includes("footer") || html.includes("sidebar");
}

function handleFile(html, logPrefix, name, findComponents)
{
    const root = HTMLParser.parse(html);

    const body = root.querySelector("body");
    if (body)
    {
        const bodyAttrs = body.rawAttrs;
        const bodyAttrsArray = bodyAttrs.split(" ");
        for (let i = 0; i < bodyAttrsArray.length; i++)
        {
            const attr = bodyAttrsArray[i];
            if (attr.includes("class="))
            {
                const classes = attr.split("=")[1].replace(/"/g, "");
                const classesArray = classes.split(" ");
                for (let j = 0; j < classesArray.length; j++)
                {
                    const className = classesArray[j];
                    if (className !== undefined && className !== null && className !== "")
                    {
                        const classToAdd = "document.body.classList.add(\"" + className + "\");\n";
                        if (!componentDidMountPage.includes(classToAdd))
                        {
                            componentDidMountPage += classToAdd;
                        }
                    }
                }
            }
        }
    }

    let imports = [];

    // Extract page title
    const titleTag = root.querySelector("title");
    let pageTitle;
    if (titleTag)
    {
        let pageTitleLoader = load(logPrefix + " - Extracting page title");
        pageTitle = titleTag.innerHTML;

        // Remove title tag
        titleTag.remove();

        pageTitleLoader.succeed(logPrefix + " - Extracted page title");
    }

    functionName = name;

    var JSXFunctionStart = createFunctionStart(functionName, pageTitle);

    if (findComponents)
    {
        // Extract <header> and <footer> from file
        const Header = root.querySelector("header");
        if (Header !== null)
        {
            const extractHeaderLoader = load(logPrefix + " - Extracting Header");
            HeaderContents = Header;
            Header.remove();
            extractHeaderLoader.succeed(logPrefix + " - Extracted Header");
        }

        const Footer = root.querySelector("footer");
        if (Footer !== null)
        {
            const extractFooterLoader = load(logPrefix + " - Extracting Footer");
            FooterContents = Footer;
            Footer.remove();
            extractFooterLoader.succeed(logPrefix + " - Extracted Footer");
        }

        const Sidebar = root.querySelector("aside");
        if (Sidebar !== null)
        {
            const extractSidebarLoader = load(logPrefix + " - Extracting Sidebar");
            SidebarContents = Sidebar;
            Sidebar.remove();
            extractSidebarLoader.succeed(logPrefix + " - Extracted Sidebar");
        }
    }

    // Resolve unclosed img tags
    const imgTags = root.querySelectorAll("img");
    imgTags.forEach(imgTag =>
    {
        let importImgLoader = load(logPrefix + " - Importing and converting img tag");
        const imgSrc = imgTag.getAttribute("src");
        if (imgSrc !== null)
        {
            if (fs.existsSync(imgSrc))
            {
                // Create img folder if it doesn't exist
                const imgFolder = assetsFolder + "/img";
                let imgDest;

                if (imgSrc.startsWith("/"))
                {
                    imgDest = imgSrc.substring(1);
                }

                if (!fs.existsSync(imgFolder))
                {
                    fs.mkdirSync(imgFolder);
                }

                if (imgSrc.includes("img/") || imgSrc.includes("images/"))
                {
                    // Strip img/ or images/ from path
                    imgDest = imgSrc.replace("img/", "");
                    imgDest = imgSrc.replace("images/", "");
                }

                // If image source contains folders, create them 
                const imgSrcFolders = imgDest.split("/");
                if (imgSrcFolders.length > 1)
                {
                    let folderPath = imgFolder;
                    for (let i = 0; i < imgSrcFolders.length - 1; i++)
                    {
                        folderPath += "/" + imgSrcFolders[i];
                        if (!fs.existsSync(folderPath))
                        {
                            fs.mkdirSync(folderPath);
                        }
                    }
                }

                fs.copyFile("./" + imgSrc, imgFolder + "/" + imgDest, (err) =>
                {
                    if (err)
                    {
                        throw err;
                    }
                });

                let fileName = imgSrc.split("/").pop();
                fileName = fileName.split(".").shift();
                fileName = fileName.replace(/-([a-z])/g, g => g[1].toUpperCase());
                // Replace remaining hyphens with underscores
                fileName = fileName.replace(/-/g, "_");
                // Replace remaining underscores with camel case
                fileName = fileName.replace(/_([a-z])/g, g => g[1].toUpperCase());
                fileName = fileName.charAt(0).toUpperCase() + fileName.slice(1);

                fileName = fileName + "Img";

                // If image is in a folder, add folder name to file name
                if (imgSrcFolders.length > 1)
                {
                    fileName = imgSrcFolders[imgSrcFolders.length - 2] + fileName;
                    fileName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
                }

                const fullImport = "import " + fileName + " from '" + imgFolder.replace('./jsx/', '../') + "/" + imgDest + "';";

                if (!imports.includes(fullImport))
                {
                    imports.push(fullImport);
                }

                const jsxImgSrc = "{" + fileName + "}";
                imgTag.setAttribute("src", jsxImgSrc);

                imgTag.setAttribute("alt", imgTag.getAttribute("alt") || fileName);

                importImgLoader.succeed(logPrefix + " - Imported and converted img tag");

                if (!imgTag.rawAttrs.endsWith("/"))
                {
                    let unclosedImgLoader = load(logPrefix + " - Fixing unclosed img tag");
                    imgTag.rawAttrs += "/";
                    unclosedImgLoader.succeed(logPrefix + " - Fixed unclosed img tag");
                }
            }
        }
    });

    // Resolve unclosed input tags
    const fixInputLoader = load(logPrefix + " - Fixing unclosed input tags");
    const inputTags = root.querySelectorAll("input");
    inputTags.forEach(inputTag =>
    {
        if (!inputTag.rawAttrs.endsWith("/"))
        {
            inputTag.rawAttrs += "/";
        }
    });
    fixInputLoader.succeed(logPrefix + " - Fixed unclosed input tags");

    // Convert css link to import
    const cssConvertLoader = load(logPrefix + " - Converting css link to import");
    const cssLinkTags = root.querySelectorAll("link[rel='stylesheet']");
    for (let i = 0; i < cssLinkTags.length; i++)
    {
        const cssLinkTag = cssLinkTags[i];
        const link = cssLinkTag.getAttribute("href");
        const cssImport = "import '" + assetsFolder.replace("./jsx/", "../") + "/" + link + "';\n";

        // Look for file in current directory
        if (fs.existsSync(link))
        {
            // Create css folder if it doesn't exist
            if (!fs.existsSync(assetsFolder + "/css"))
            {
                fs.mkdirSync(assetsFolder + "/css");
            }

            // IF link contains subfolders, create them
            const linkFolders = link.split("/");
            if (linkFolders.length > 1)
            {
                let folderPath = assetsFolder + "/css";
                for (let i = 0; i < linkFolders.length - 1; i++)
                {
                    folderPath += "/" + linkFolders[i];
                    if (!fs.existsSync(folderPath))
                    {
                        fs.mkdirSync(folderPath);
                    }
                }
            }

            // Copy file to assets folder
            fs.copyFileSync("./" + link, assetsFolder + "/" + link);
        }

        imports.push(cssImport);

        // Remove link tag
        cssLinkTag.remove();
    }

    cssConvertLoader.succeed(logPrefix + " - Converted css link to import");

    // Convert js link to import
    const jsConvertLoader = load(logPrefix + " - Converting js link to import");
    const jsLinkTags = root.querySelectorAll("script[src]");
    for (let i = 0; i < jsLinkTags.length; i++)
    {
        const jsLinkTag = jsLinkTags[i];
        const link = jsLinkTag.getAttribute("src");

        if (!link.includes("wow"))
        {
            // Look for file in current directory
            if (fs.existsSync(link))
            {
                // Create js folder if it doesn't exist
                if (!fs.existsSync(assetsFolder + "/js"))
                {
                    fs.mkdirSync(assetsFolder + "/js");
                }

                // Copy file to assets folder
                fs.copyFileSync("./" + link, assetsFolder + "/" + link);

                // File is extra javascript, put in main layout componentdidmount
                const fileContents = fs.readFileSync(assetsFolder + "/" + link, "utf8");

                if (!fileContents.includes("WOW"))
                {
                    componentDidMountJs = fileContents;
                }
            }
            else if (link.includes("https://"))
            {
                imports.push("import '" + link + "';\n");
            }

        }

        // Remove link tag
        jsLinkTag.remove();
    }

    jsConvertLoader.succeed(logPrefix + " - Converted js link to import");

    const inlineJsConvertLoader = load(logPrefix + " - Converting inline js to componentDidMount");
    const inlineJsTags = root.querySelectorAll("script:not([src])");
    for (let i = 0; i < inlineJsTags.length; i++)
    {
        const inlineJsTag = inlineJsTags[i];
        const fileContents = inlineJsTag.innerHTML;
        if (!fileContents.includes("WOW"))
        {
            componentDidMountJs = fileContents;
        }
        inlineJsTag.remove();
    }

    inlineJsConvertLoader.succeed(logPrefix + " - Converted inline js to componentDidMount");

    const inlineCssConvertLoader = load(logPrefix + " - Converting inline css to componentDidMount");
    const inlineCssTags = root.querySelectorAll("style");
    for (let i = 0; i < inlineCssTags.length; i++)
    {
        const inlineCssTag = inlineCssTags[i];
        const fileContents = inlineCssTag.innerHTML;
        componentDidMountCss = fileContents;
        inlineCssTag.remove();
    }

    inlineCssConvertLoader.succeed(logPrefix + " - Converted inline css to componentDidMount");

    // Detect wow.js from class
    const lookforWow = load(logPrefix + " - Detecting wow.js from class");
    const wowTags = root.querySelectorAll(".wow");
    if (wowTags.length > 0)
    {
        lookforWow.succeed(logPrefix + " - Detected wow.js from class");
        const wowImportLoader = load(logPrefix + " - Converting wow.js to ReactWOW");
        // Add reactWOW to imports
        if (!imports.includes("import ReactWOW from 'react-wow';\n"))
        {
            imports.push("import ReactWOW from 'react-wow';\n");
        }

        // Convert to ReactWOW
        for (let i = 0; i < wowTags.length; i++)
        {
            let wowTag = wowTags[i];
            const wowDelay = wowTag.getAttribute("data-wow-delay");
            const wowDuration = wowTag.getAttribute("data-wow-duration");
            let animation = wowTag.getAttribute("data-wow-animation");

            // Try and find animation i classlist
            if (!animation)
            {
                const classList = wowTag.classList;
                const animatecssAnimations = ["bounce", "flash", "pulse", "rubberBand", "shake", "headShake", "swing", "tada", "wobble", "jello", "heartBeat", "bounceIn", "bounceInDown", "bounceInLeft", "bounceInRight", "bounceInUp", "bounceOut", "bounceOutDown", "bounceOutLeft", "bounceOutRight", "bounceOutUp", "fadeIn", "fadeInDown", "fadeInDownBig", "fadeInLeft", "fadeInLeftBig", "fadeInRight", "fadeInRightBig", "fadeInUp", "fadeInUpBig", "fadeOut", "fadeOutDown", "fadeOutDownBig", "fadeOutLeft", "fadeOutLeftBig", "fadeOutRight", "fadeOutRightBig", "fadeOutUp", "fadeOutUpBig", "flipInX", "flipInY", "flipOutX", "flipOutY", "lightSpeedIn", "lightSpeedOut", "rotateIn", "rotateInDownLeft", "rotateInDownRight", "rotateInUpLeft", "rotateInUpRight", "rotateOut", "rotateOutDownLeft", "rotateOutDownRight", "rotateOutUpLeft", "rotateOutUpRight", "hinge", "jackInTheBox", "rollIn", "rollOut", "zoomIn", "zoomInDown", "zoomInLeft", "zoomInRight", "zoomInUp", "zoomOut", "zoomOutDown", "zoomOutLeft", "zoomOutRight", "zoomOutUp", "slideInDown", "slideInLeft", "slideInRight", "slideInUp", "slideOutDown", "slideOutLeft", "slideOutRight", "slideOutUp"];

                for (let k = 0; k < animatecssAnimations.length; k++)
                {
                    const animatecssAnimation = animatecssAnimations[k];
                    if (classList.contains(animatecssAnimation))
                    {
                        animation = animatecssAnimation;
                        // Remove class
                        wowTag.classList.remove(animatecssAnimation);
                        break;
                    }
                }

                // Remove "wow" class
                wowTag.classList.remove("wow");
            }

            wowTag.removeAttribute("data-wow-delay");
            wowTag.removeAttribute("data-wow-duration");
            wowTag.removeAttribute("data-wow-animation");

            // Add ReactWOW
            const ReactWOW = "<ReactWOW animation='" + animation + "' delay='" + wowDelay + "' duration='" + wowDuration + "'>" + wowTag.outerHTML + "</ReactWOW>";

            wowTag.innertHTML = ReactWOW;

            // Replace wowTag with ReactWOW
            wowTag.replaceWith(ReactWOW);

            // Replace tag
            wowImportLoader.succeed(logPrefix + " - Converted wow.js to ReactWOW");
        }
    }
    else
    {
        lookforWow.succeed(logPrefix + " - Didn't detect wow.js from class");
    }

    // Remove all meta tags
    const metaConversionLoader = load(logPrefix + " - Removing meta tags");
    const metaTags = root.querySelectorAll("meta");
    metaTags.forEach(metaTag =>
    {
        metaTag.remove();
    });

    metaConversionLoader.succeed(logPrefix + " - Removed meta tags");

    // Remove remaining <link> tags
    const linkConversionLoader = load(logPrefix + " - Removing link tags");
    const linkTags = root.querySelectorAll("link");
    linkTags.forEach(linkTag =>
    {
        linkTag.remove();
    });

    linkConversionLoader.succeed(logPrefix + " - Removed link tags");

    const pageLinks = root.querySelectorAll("a");
    pageLinks.forEach(pageLink =>
    {
        const href = pageLink.getAttribute("href");
        let newHref = href;
        if (href && href.includes(".html"))
        {
            if (href.includes("index.html"))
            {
                newHref = "/";
            }
            else
            {
                newHref = href.replace(".html", "");
            }

            pageLink.setAttribute("href", newHref);

            if (!imports.includes("import { Link } from 'react-router-dom';\n"))
            {
                imports.push("import { Link } from 'react-router-dom';\n");
            }
        }
        else if (href && href.includes("javascript:"))
        {
            newHref = "/";
            pageLink.setAttribute("href", newHref);

            if (!imports.includes("import { Link } from 'react-router-dom';\n"))
            {
                imports.push("import { Link } from 'react-router-dom';\n");
            }
        }
    });

    const jsxConversionLoader = load(logPrefix + " - Converting to JSX");

    // // Convert to JSX
    var converter = new HTMLtoJSX({
        createClass: false
    });

    var jsx = converter.convert(root.toString());

    // Replace reactwow with ReactWOW
    jsx = jsx.replace(/reactwow/g, "ReactWOW");

    // Replace link with Link
    jsx = jsx.replace(/link/g, "Link");

    const jsxLinksStart = jsx.match(/<a/g);
    if (jsxLinksStart)
    {
        jsx = jsx.replace(/<a/g, "<Link");
    }

    const jsxHrefs = jsx.match(/href/g);
    if (jsxHrefs)
    {
        jsx = jsx.replace(/href/g, "to");
    }

    const jsxLinksEnd = jsx.match(/<\/a>/g);
    if (jsxLinksEnd) 
    {
        jsx = jsx.replace(/<\/a>/g, "</Link>");
    }

    const jsxReactLinks = jsx.match(/<Link/g);
    if (jsxReactLinks)
    {
        // Find classnames
        const jsxReactLinkClassNames = jsx.match(/className=".*?"/g);
        if (jsxReactLinkClassNames)
        {
            // Remove \n and \t
            jsx = jsx.replace(/\\n/g, "");
            jsx = jsx.replace(/\\t/g, "");
        }
    }

    // // Remove quotes arround img src object
    jsx = jsx.replace(/src="(\{.*\})"/g, "src=$1");

    // If element repeats, make it a component
    const jsxElements = jsx.match(/<.*?>/g);
    if (jsxElements)
    {
        const jsxElementCount = {};
        jsxElements.forEach(jsxElement =>
        {
            if (jsxElementCount[jsxElement])
            {
                jsxElementCount[jsxElement]++;
            }
            else
            {
                jsxElementCount[jsxElement] = 1;
            }
        });

        // Check if any elements are repeated more than 3 times
        for (const jsxElement in jsxElementCount)
        {
            if (jsxElementCount[jsxElement] > 3)
            {
                // Check if element is a component
                if (isComponent(jsxElement))
                {
                    // Create component
                    const componentFolder = path.join(__dirname, "src", "components");
                    const componentFile = path.join(componentFolder, jsxElement.replace("<", "").replace(">", "").toLowerCase() + ".js");
                    const componentLoad = load(logPrefix + " - Creating component " + jsxElement.replace("<", "").replace(">", "").toLowerCase());
                    fs.writeFileSync(componentFile, jsxElement);
                    componentLoad.succeed(logPrefix + " - Created component " + jsxElement.replace("<", "").replace(">", "").toLowerCase());

                    // Replace element with component
                    jsx = jsx.replace(new RegExp(jsxElement, "g"), jsxElement.replace("<", "").replace(">", "").toLowerCase());
                }
            }
        }
    }

    var JSXFunctionEnd = createFunctionEnd();

    const importsToString = imports.join("");

    jsx = importsToString + JSXFunctionStart + jsx + JSXFunctionEnd;

    jsxConversionLoader.succeed(logPrefix + " - Converted to JSX");

    return jsx;
}


fs.readdirSync("./").forEach(file =>
{
    // If file is html
    if (file.endsWith(".html"))
    {
        // Read file
        var html = fs.readFileSync(file, 'utf8');
        const fileName = file.split(".")[0];
        const logPrefix = file;

        const functionName = createFunction(fileName);

        const jsx = handleFile(html, logPrefix, functionName, true);
        const jsxFolderLoader = load(logPrefix + " - Looking for JSX folder");

        // Create JSX folder if it doesn't exist
        if (!fs.existsSync("./jsx"))
        {
            fs.mkdirSync("./jsx");
        }

        // If file exists, delete it
        if (fs.existsSync("./jsx/" + functionName + ".jsx"))
        {
            log(logPrefix + " - Deleting existing file");
            fs.unlinkSync("./jsx/" + functionName + ".jsx");
        }

        jsxFolderLoader.succeed(logPrefix + " - Found JSX folder");

        const formatLoader = load(logPrefix + " - Formatting");
        // Format JSX
        var formattedJSX = prettier.format(jsx, {
            semi: false,
            singleQuote: true,
            parser: "babel"
        });

        formatLoader.succeed(logPrefix + " - Formatted");

        const createFileLoader = load(logPrefix + " - Creating file");
        // Create new 
        fs.appendFileSync(pagesFolder + "/" + functionName + ".jsx", formattedJSX);

        createFileLoader.succeed(logPrefix + " - Converted to " + pagesFolder + functionName + ".jsx");
    }
});


// Create components folder
const createComponentsFolderLoader = load("Creating Components folder");
if (fs.existsSync("./jsx/" + "./Components/"))
{
    fs.rmSync("./jsx/" + "./Components/", { recursive: true });
}

fs.mkdirSync("./jsx/" + "./Components/");

createComponentsFolderLoader.succeed("Created Components folder");

function handleComponent(name, contents)
{
    if (contents !== undefined)
    {
        // Create " + name + " Component
        if (fs.existsSync("./jsx/" + "./Components/" + name + ".jsx"))
        {
            fs.unlinkSync("./jsx/" + "./Components/" + name + ".jsx");
        }

        const logPrefix = "" + name;

        const jsx = handleFile(contents, logPrefix, "" + name, false);

        const formatLoader = load(logPrefix + " - Formatting");
        // Format JSX
        var formattedJSX = prettier.format(jsx, {
            semi: false,
            singleQuote: true,
            parser: "babel"
        });

        formatLoader.succeed(logPrefix + " - Formatted");

        const createFileLoader = load(logPrefix + " - Creating file");
        // Create new 
        fs.appendFileSync(componentsFolder + "/" + name + ".jsx", formattedJSX);

        createFileLoader.succeed(logPrefix + " - Converted to ./jsx/" + "Components/" + name + ".jsx");

    }
}

handleComponent("Header", HeaderContents);
handleComponent("Footer", FooterContents);
handleComponent("Sidebar", SidebarContents);


const mainLayoutLoader = load("Creating Main Layout");

let MainLayoutContents = "import React from 'react';\n";
if (HeaderContents !== undefined)
{
    MainLayoutContents += "import Header from '../Components/Header';\n";
}
if (FooterContents !== undefined)
{
    MainLayoutContents += "import Footer from '../Components/Footer';\n";
}

if (SidebarContents !== undefined)
{
    MainLayoutContents += "import Sidebar from '../Components/Sidebar';\n";
}


MainLayoutContents += "import { Outlet } from 'react-router-dom';\n";
MainLayoutContents += "export default class Main extends React.Component {\n";
MainLayoutContents += "    componentDidMount() {\n";
MainLayoutContents += componentDidMountJs + "\n";
MainLayoutContents += "    }\n";
MainLayoutContents += "    render() {\n";
MainLayoutContents += "    return (\n";
MainLayoutContents += "        <div>\n";
if (HeaderContents !== undefined)
{
    MainLayoutContents += "            <Header />\n";
}

if (SidebarContents !== undefined)
{
    MainLayoutContents += "            <Sidebar />\n";
}

MainLayoutContents += "            <Outlet/>\n";

if (FooterContents !== undefined)
{
    MainLayoutContents += "            <Footer />\n";
}

MainLayoutContents += "        </div>\n";

MainLayoutContents += "    );\n";

MainLayoutContents += "}\n";
MainLayoutContents += "}\n";

if (fs.existsSync(layoutsFolder + "/Main.jsx"))
{
    fs.unlinkSync(layoutsFolder + "/Main.jsx");
}

fs.writeFileSync(layoutsFolder + "/Main.jsx", MainLayoutContents);

mainLayoutLoader.succeed("Created Main Layout file");

const viteproject = load("Creating vite project");

if (fs.existsSync(viteFolder))
{
    fs.rmSync(viteFolder, { recursive: true });
}

execute("yarn create vite vite --template react", function (output)
{
    viteproject.succeed("Created vite project");

    const copyLoader = load("Creating structure");
    // Remove default files
    fs.rmSync(viteFolder + "/src", { recursive: true });

    // Create main.jsx
    fs.mkdirSync(viteFolder + "/src");

    const imports = [];
    const pages = fs.readdirSync(pagesFolder);
    pages.forEach(page =>
    {
        const pageName = page.split(".")[0];
        imports.push("import " + pageName + " from '." + pagesDist + "/" + pageName + "';");
    });

    imports.push("import Main from '." + layoutsDist + "/Main';");

    const pageImportsToString = imports.join("\n");

    let mainJSX = "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport {createBrowserRouter,RouterProvider} from 'react-router-dom';" + pageImportsToString;

    let pagesToRoute;

    // Create root route
    // Check if there is a 404 or NotFound page
    let NotFoundPage = undefined;
    pages.forEach(page =>
    {
        const pageName = page.split(".")[0];
        if (pageName === "404" || pageName === "NotFound")
        {
            NotFoundPage = pageName;
        }
    });

    if (NotFoundPage !== undefined)
    {
        pagesToRoute = "{ path: '/', element: <Main/>, errorElement: <" + NotFoundPage + "/> ";
    }
    else
    {
        pagesToRoute = "{ path: '/', element: <Main/>";
    }

    const pageRoutes = [];

    pages.forEach(page =>
    {
        const pageName = page.split(".")[0];
        // Convert camelcase to kebab-case
        const kebabCasePageName = pageName.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

        // Remove hyphen from start
        const kebabCasePageNameWithoutHyphen = kebabCasePageName.replace("-", "");

        if (kebabCasePageNameWithoutHyphen === "index")
        {
            pageRoutes.push("{ path: '/', element: <" + pageName + " /> },");
        }
        else
        {
            pageRoutes.push("{ path: '/" + kebabCasePageNameWithoutHyphen + "', element: <" + pageName + " /> },");
        }

    });

    mainJSX += "\nconst router = createBrowserRouter(\n    [\n     ";
    mainJSX += pagesToRoute + "\n";
    mainJSX += ",children: [\n";
    for (let i = 0; i < pageRoutes.length; i++)
    {
        mainJSX += pageRoutes[i] + "\n";
    }
    mainJSX += "        ]\n";
    mainJSX += "    }\n";
    mainJSX += "]);\n";


    mainJSX += "\nReactDOM.createRoot(document.getElementById('root')).render(\n          <RouterProvider router={router} />\n            );";

    fs.writeFileSync(viteFolder + "/src/main.jsx", mainJSX);

    copyLoader.succeed("Created structure");
    const copyFilesLoader = load("Copying files");

    // Copy components
    fs.mkdirSync(viteFolder + "/src" + componentsDist);
    const components = fs.readdirSync(componentsFolder);
    components.forEach(component =>
    {
        fs.copyFileSync(componentsFolder + "/" + component, viteFolder + "/src" + componentsDist + "/" + component);
    });

    // Copy layouts
    fs.mkdirSync(viteFolder + "/src" + layoutsDist);
    const layouts = fs.readdirSync(layoutsFolder);
    layouts.forEach(layout =>
    {
        fs.copyFileSync(layoutsFolder + "/" + layout, viteFolder + "/src" + layoutsDist + "/" + layout);
    });

    // Copy pages
    fs.mkdirSync(viteFolder + "/src" + pagesDist);
    pages.forEach(page =>
    {
        fs.copyFileSync(pagesFolder + "/" + page, viteFolder + "/src" + pagesDist + "/" + page);
    });

    // Copy assets
    fs.mkdirSync(viteFolder + "/src" + assetsDist);
    fse.copySync(assetsFolder, viteFolder + "/src" + assetsDist);

    copyFilesLoader.succeed("Copied files");

    let installLoader = load("Installing dependencies");
    execute("cd vite && yarn", function (success)
    {
        installLoader.succeed("Installed dependencies");

        // Installing dependencies: react-router-dom, react-wow
        let installDependenciesLoader = load("Adding dependencies: react-router-dom, react-wow");
        execute("cd vite && yarn add react-router-dom react-wow", function (success)
        {
            installDependenciesLoader.succeed("Added dependencies: react-router-dom, react-wow");

            // BUild
            let buildLoader = load("Building");
            execute("cd vite && yarn build", function (success)
            {
                buildLoader.succeed("Built");

                // Remove "jsx" folder
                fs.rmSync("./jsx", { recursive: true });

                console.log("Done!");
            });
        });
    });
});
