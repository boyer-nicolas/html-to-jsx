import prettier from 'prettier';
import HTMLtoJSX from 'htmltojsx';
import fs from 'fs';
import { exec } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import { exit } from 'process';
import HTMLParser from 'node-html-parser';
import fse from 'fs-extra';

/**
 * ===================== START UTILS =====================
 */

/**
 * Consts
 */
const viteFolder = "./vite";
const processName = process.argv[2];

const assetsFolder = "/Assets";
const pagesFolder = "/Pages";
const layoutsFolder = "/Layouts";
const componentsFolder = "/Components";
const imgFolder = "/img";
const cssFolder = "/css";
const scssFolder = "/scss";
const jsFolder = "/js";
const fontsFolder = "/fonts";

// Conversion
const conversionFolder = "./jsx";
const conversionAssets = conversionFolder + assetsFolder;
const conversionPages = conversionFolder + pagesFolder;
const conversionLayouts = conversionFolder + layoutsFolder;
const conversionComponents = conversionFolder + componentsFolder;
const conversionImg = conversionAssets + imgFolder;
const conversionCss = conversionAssets + cssFolder;
const conversionScss = conversionAssets + scssFolder;
const conversionJs = conversionAssets + jsFolder;
const conversionFonts = conversionAssets + fontsFolder;

// Imports
const importBase = "..";
const importAssets = importBase + assetsFolder;
const importPages = "." + pagesFolder;
const importLayouts = "." + layoutsFolder;
const importComponents = importBase + componentsFolder;
const importImg = importAssets + imgFolder;
const scssImportImg = importBase + imgFolder;
const importCss = importAssets + cssFolder;
const importScss = importAssets + scssFolder;
const importJs = importAssets + jsFolder;
const importFonts = importAssets + fontsFolder;

/**
 * Vars
 */
let componentDidMountMain = [];
let componentDidMountPage = [];
let functionName = "";
let HeaderContents, FooterContents, SidebarContents;
let dependencies = [];
let imports = [];
let logPrefix = "";
let imgFolderFound = false;

/**
 * Find files in a directory recursively
 */
function findFiles(folder, extension)
{
    let findFilesLoader = load("Finding " + extension + " files");
    let files = [];
    let filesFound = false;

    if (fs.existsSync(folder))
    {
        files = fs.readdirSync(folder);
        filesFound = true;
    }

    if (filesFound === false)
    {
        findFilesLoader.fail("Failed to find " + extension + " files");
        return false;
    }
    else
    {
        findFilesLoader.succeed("Found " + extension + " files");
    }

    return files;
}

/**
 * Find a single file in a directory recursively
 */
function findFile(file)
{
    let fileFound = false;
    let fileContents;
    let fileLocation;

    if (fs.existsSync(file))
    {
        fileFound = true;
        fileContents = fs.readFileSync(file, "utf8");
        fileLocation = file;
    }
    else
    {
        fileFound = false;
    }

    if (fileFound === false)
    {
        return false;
    }

    return fileLocation;
}

/**
 * Show loading message
 */
function load(message)
{
    return ora(`${chalk.cyanBright(message)}`).start();
}

/**
 * Pretty log
 */
function log(message)
{
    console.log(chalk.cyanBright("[MIGRATION] ") + message);
}

/**
 * Exec shell command
 */
function execute(command, callback)
{
    exec(command, function (error, stdout, stderr) { callback(stdout); });
};

// If path is assets, pages, layouts, components, images, css, scss or js
function isAssetsPath(path)
{
    return path.includes(assetsDist);
}

function isPagesPath(path)
{
    return path.includes(pagesDist);
}

function isLayoutsPath(path)
{
    return path.includes(layoutsDist);
}

function isComponentsPath(path)
{
    return path.includes(componentsDist);
}

function isImagePath(path)
{
    return path === importImg;
}

/**
 * Create function name
 */
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

/**
 * Create function start
 */
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

            JSXFunctionStart += componentDidMountPage.join("\n");
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

        if (appendTitle === 1 && !isComponent(name))
        {
            JSXFunctionStart += "        document.title = \"" + pageTitle + "\";\n";
        }

        if (componentDidMountPage !== undefined && componentDidMountPage !== null && !isComponent(name))
        {
            JSXFunctionStart += componentDidMountPage.join("\n");
        }

        JSXFunctionStart += "    }\n\n";
        JSXFunctionStart += "    render() {\n";
        JSXFunctionStart += "    return (\n";
    }

    createFunctionStartLoader.succeed("Created " + name + " function start");

    return JSXFunctionStart;
}

/**
 * Create function end
 */
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


/**
 * Strip a path of its file name
 */
function stripPath(path)
{
    const fileExtension = path.split(".").pop();
    let pathWithoutExtension = path.replace("." + fileExtension, "");
    const foldersToRemove = [
        "css",
        "style",
        "stylesheet",
        "asset",
        "script",
        "js",
        "javascript",
        "img",
        "image",
        "font",
    ]

    for (let i = 0; i < foldersToRemove.length; i++)
    {
        const folderToRemove = foldersToRemove[i];
        const doNotRemoveExtension = "." + folderToRemove;

        const folderToRemoveUpperCase = folderToRemove.toUpperCase();
        const folderToRemoveCamelCase = folderToRemove.replace(/-([a-z])/g, g => g[1].toUpperCase());
        const folderToRemovePlural = folderToRemove + "s";

        if (pathWithoutExtension.includes(folderToRemovePlural))
        {
            pathWithoutExtension = pathWithoutExtension.replace(folderToRemovePlural, "");
        }

        if (pathWithoutExtension.includes(foldersToRemove[i]))
        {
            pathWithoutExtension = pathWithoutExtension.replace(foldersToRemove[i], "");
        }

        if (pathWithoutExtension.includes(folderToRemoveUpperCase))
        {
            pathWithoutExtension = pathWithoutExtension.replace(folderToRemoveUpperCase, "");
        }

        if (pathWithoutExtension.includes(folderToRemoveCamelCase))
        {
            pathWithoutExtension = pathWithoutExtension.replace(folderToRemoveCamelCase, "");
        }

        // Remove "//" from pathWithoutExtension
        pathWithoutExtension = pathWithoutExtension.replace("//", "/");
    }

    return pathWithoutExtension + "." + fileExtension;
}

function isComponent(html)
{
    return html.includes("header") || html.includes("footer") || html.includes("sidebar");
}

/**
 * Check if there are any .html files in the directory
 */
function htmlExists()
{
    let checkHtml = load("Checking for HTML files");
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
}

/**
 * Create a folder
 */
function createFolder(folder)
{
    let createFolderLoader = load("Creating " + folder + " folder");
    fs.mkdirSync(folder);
    createFolderLoader.succeed("Created " + folder + " folder");
}

/**
 * Clear a single folder
 */
function clearFolder(folder)
{
    if (fs.existsSync(folder))
    {
        let clearFolderLoader = load("Clearing " + folder + " folder");
        fs.rmSync(folder, { recursive: true }, (err) =>
        {
            if (err)
            {
                clearFolderLoader.fail("Failed to clear " + folder + " folder");
                throw err;
            }
        });
        clearFolderLoader.succeed("Cleared " + folder + " folder");
    }
}

/**
 * Clear previous output
 */
function clearFolders()
{
    // Clear and create conversion folder
    clearFolder(conversionFolder);
    createFolder(conversionFolder);

    // Clear and create assets folder
    clearFolder(conversionAssets);
    createFolder(conversionAssets);

    // Clear and create pages folder
    clearFolder(conversionPages);
    createFolder(conversionPages);

    // Clear and create layouts folder
    clearFolder(conversionLayouts);
    createFolder(conversionLayouts);

    // Clear and create Components folder
    clearFolder(conversionComponents);
    createFolder(conversionComponents);

    // Clear and create scss folder
    clearFolder(conversionScss);
    createFolder(conversionScss);

    // Clear and create js folder
    clearFolder(conversionJs);
    createFolder(conversionJs);

    // Clear and create images folder
    clearFolder(conversionImg);
    createFolder(conversionImg);

    // Clear and create css folder
    clearFolder(conversionCss);
    createFolder(conversionCss);

    // Clear and create fonts folder
    clearFolder(conversionFonts);
    createFolder(conversionFonts);


    // Clear vite folder
    clearFolder(viteFolder);
}

/**
* Ensure that the user specified a process for the script. Either "function" or "class"
*/
function checkProcess()
{
    if (!processName)
    {
        log('Usage: node migration.js <process?function,class>')
        process.exit(1)
    }
}

/**
 * Handle page title
 */
function handlePageTitle(root)
{
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

    return pageTitle;
}

/**
 * Handle Body
 */
function handleBody(body)
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
                        componentDidMountPage.push(classToAdd);
                    }
                    else
                    {
                        componentDidMountPage.remove(classToAdd);
                        componentDidMountMain.push(classToAdd);
                    }
                }
            }
        }
    }
}

/**
 * Handle Images
 */
function handleImages(root)
{
    // Resolve unclosed img tags
    let importImgLoader = load(logPrefix + " - Importing and converting img tag");

    const imgTags = root.querySelectorAll("img");
    imgTags.forEach(imgTag =>
    {
        const imgSrc = imgTag.getAttribute("src");
        if (imgSrc !== null)
        {
            if (fs.existsSync(imgSrc))
            {
                // Create img folder if it doesn't exist
                let imgDest;

                if (imgSrc.startsWith("/"))
                {
                    imgDest = imgSrc.substring(1);
                }

                if (imgSrc.includes("img/") || imgSrc.includes("images/"))
                {
                    // Strip img/ or images/ from path
                    imgDest = stripPath(imgSrc);
                }

                // If image source contains folders, create them 
                const imgSrcFolders = imgDest.split("/");
                if (imgSrcFolders.length > 1)
                {
                    let folderPath = conversionImg;
                    for (let i = 0; i < imgSrcFolders.length - 1; i++)
                    {
                        folderPath += "/" + imgSrcFolders[i];
                        if (!fs.existsSync(folderPath))
                        {
                            fs.mkdirSync(folderPath);
                        }
                    }
                }

                // Remove potential "./" from path
                if (imgDest.includes("./"))
                {
                    imgDest = imgDest.replace("./", "/");
                }

                fs.copyFile(imgSrc, conversionImg + imgDest, (err) =>
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
                    const folderName = imgSrcFolders[imgSrcFolders.length - 2];
                    const folderNameCamelCase = folderName.replace(/-([a-z])/g, g => g[1].toUpperCase());
                    fileName = folderNameCamelCase + fileName;
                    fileName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
                }

                const fullImport = "import " + fileName + " from '" + importImg + imgDest + "';";

                if (!imports.includes(fullImport))
                {
                    imports.push(fullImport);
                }

                const jsxImgSrc = "{" + fileName + "}";
                imgTag.setAttribute("src", jsxImgSrc);

                const alt = imgTag.getAttribute("alt");
                if (alt !== null && alt !== "" && alt !== undefined && alt !== "#")
                {
                    imgTag.setAttribute("alt", alt);
                }
                else
                {
                    imgTag.setAttribute("alt", fileName);
                }


                if (!imgTag.rawAttrs.endsWith("/"))
                {
                    let unclosedImgLoader = load(logPrefix + " - Fixing unclosed img tag");
                    imgTag.rawAttrs += "/";
                    unclosedImgLoader.succeed(logPrefix + " - Fixed unclosed img tag");
                }
            }
        }
    });

    importImgLoader.succeed(logPrefix + " - Imported and converted img tag");
}

/**
 * Handle Inputs
 */
function handleInputs(root)
{
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
}

/**
 * Handle styles
 */
function handleStyles(root)
{
    // Convert css link to import
    const cssConvertLoader = load(logPrefix + " - Converting css link to import");
    const cssLinkTags = root.querySelectorAll("link[rel='stylesheet']");
    for (let i = 0; i < cssLinkTags.length; i++)
    {
        const cssLinkTag = cssLinkTags[i];
        const link = cssLinkTag.getAttribute("href");

        // Look for file in current directory
        if (fs.existsSync(link))
        {
            const scssExtension = ".scss";
            const cssFileNoExtension = link.split(".").shift();
            const scssFileToFind = cssFileNoExtension.replace("css", "scss");
            const scssFile = findFile(scssFileToFind + scssExtension);

            if (scssFile !== false)
            {
                if (!dependencies.includes("sass"))
                {
                    dependencies.push("sass");
                }

                const scssFileNoPathFound = scssFile.split("/").pop();
                const scssFilePathFound = scssFile.replace(scssFileNoPathFound, "");

                // Find all scss files in the same directory as the scss file found
                const scssFiles = findFiles(scssFilePathFound, scssExtension);

                fs.copyFile("./" + scssFile, conversionScss + "/" + scssFileNoPathFound, (err) =>
                {
                    if (err)
                    {
                        throw err;
                    }
                });

                // Copy all scss files in the same directory as the scss file found
                for (let i = 0; i < scssFiles.length; i++)
                {
                    const scssFile = scssFiles[i];
                    const scssFileNoPath = scssFile.split("/").pop();

                    // Check if path is folder or file
                    if (scssFileNoPath.includes("."))
                    {
                        fs.copyFile("./" + scssFilePathFound + scssFile, conversionScss + "/" + scssFileNoPath, (err) =>
                        {
                            if (err)
                            {
                                throw err;
                            }
                        });
                    }
                    else
                    {
                        const newDestFolder = "./" + conversionScss + "/" + scssFileNoPath;
                        if (!fs.existsSync(newDestFolder))
                        {
                            fs.mkdirSync(newDestFolder);
                        }

                        // Copy all files in folder
                        const scssSubFiles = findFiles("./" + scssFilePathFound + scssFile, scssExtension);
                        for (let i = 0; i < scssSubFiles.length; i++)
                        {
                            const scssSubFile = scssSubFiles[i];
                            const scssSubFileNoPath = scssSubFile.split("/").pop();

                            fs.copyFileSync("./" + scssFilePathFound + scssFile + "/" + scssSubFileNoPath, newDestFolder + "/" + scssSubFileNoPath);
                        }
                    }
                }

                // // Fix paths in scss files
                // for (let i = 0; i < scssFiles.length; i++)
                // {
                //     const scssFile = scssFiles[i];
                //     const scssFileNoPath = scssFile.split("/").pop();
                //     const scssFileContent = fs.readFileSync("./" + scssFilePathFound + scssFile, "utf8");

                //     const urls = scssFileContent.match(/url\((.*?)\)/g);
                //     if (urls !== null)
                //     {
                //         for (let i = 0; i < urls.length; i++)
                //         {
                //             const url = urls[i];
                //             const urlPath = url.split("(").pop().split(")").shift();
                //             const urlFileName = urlPath.split("/").pop();
                //             // Check if url contains image
                //             if (url.includes(".png") || url.includes(".jpg") || url.includes(".jpeg") || url.includes(".gif"))
                //             {
                //                 if (!isImagePath(url))
                //                 {
                //                     const newUrl = url.replace(url, "url('" + scssImportImg + "/" + urlFileName + ")");
                //                     const newScssFileContent = scssFileContent.replace(url, newUrl);
                //                     fs.writeFileSync(conversionScss + "/" + scssFileNoPath, newScssFileContent, "utf8");

                //                     const imageFileName = urlPath.split("/").pop();
                //                     let newPath = findFile(imageFileName);
                //                     if (newPath !== false)
                //                     {
                //                         newPath = newPath.replace(imageFileName, "");
                //                         fs.copyFile("./" + urlPath, conversionScss + "/" + newPath + imageFileName, (err) =>
                //                         {
                //                             if (err)
                //                             {
                //                                 throw err;
                //                             }
                //                         });
                //                     }
                //                 }
                //             }
                //         }
                //     }
                // }

                // Remove the css link tag
                cssLinkTag.remove();

                // Add the scss import to the imports array
                const scssImport = "import '" + importScss + "/" + scssFileNoPathFound + "';";

                if (!imports.includes(scssImport))
                {
                    imports.push(scssImport);
                }
            }
            else
            {
                const cssFileNoPath = link.split("/").pop();

                // Fix paths in css files
                const cssFileContent = fs.readFileSync(link, "utf8");
                const cssFileContentFixed = cssFileContent.replace(/url\((.*?)\)/g, "url(../img/$1)");
                fs.writeFileSync(conversionCss + "/" + cssFileNoPath, cssFileContentFixed);

                // Copy file to assets folder
                const cssImport = "import '" + importCss + "/" + cssFileNoPath + "';";
                imports.push(cssImport);
            }

        }

        // Find images in css file
        const cssFileContent = fs.readFileSync(link, "utf8");
        const urls = cssFileContent.match(/url\((.*?)\)/g);
        if (urls !== null)
        {
            for (let i = 0; i < urls.length; i++)
            {
                const url = urls[i];
                const urlPath = url.split("(").pop().split(")").shift();
                const urlFileName = urlPath.split("/").pop();
                // Check if url contains image
                if (url.includes(".png") || url.includes(".jpg") || url.includes(".jpeg") || url.includes(".gif"))
                {
                    if (!isImagePath(url))
                    {
                        const newUrl = url.replace(url, "url('" + scssImportImg + "/" + urlFileName + ")");
                        const newCssFileContent = cssFileContent.replace(url, newUrl);
                        fs.writeFileSync(conversionCss + "/" + urlFileName, newCssFileContent, "utf8");
                    }
                }
            }
        }


        // Remove link tag
        cssLinkTag.remove();
    }

    cssConvertLoader.succeed(logPrefix + " - Converted css link to import");
}

/**
 * Handle Javascript
 */
function handleJavascript(root)
{
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

                const possibleLibraries = [
                    "jquery",
                    "bootstrap",
                    "popper",
                    "fontawesome",
                    "slick",
                    "aos",
                    "fancybox",
                    "jqueryui",
                    "tiny-slider",
                    "glightbox",
                ]

                let importFile = true;
                for (let i = 0; i < possibleLibraries.length; i++)
                {
                    let library = possibleLibraries[i];
                    if (link.includes(library))
                    {
                        importFile = false;
                        switch (library)
                        {
                            case "jquery":
                                imports.push("import $ from 'jquery';");
                                dependencies.push("jquery");
                                break;
                            case "bootstrap":
                                imports.push("import 'bootstrap';");
                                dependencies.push("bootstrap");
                                break;
                            case "popper":
                                imports.push("import 'popper.js';");
                                dependencies.push("popper.js");
                                break;
                            case "fontawesome":
                                imports.push("import '@fortawesome/fontawesome-free';");
                                dependencies.push("@fortawesome/fontawesome-free");
                                break;
                            case "slick":
                                imports.push("import 'slick-carousel';");
                                dependencies.push("slick-carousel");
                                break;
                            case "aos":
                                imports.push("import AOS from 'aos';");
                                dependencies.push("aos");
                                if (!componentDidMountPage.includes("AOS.init();"))
                                {
                                    componentDidMountPage.push("AOS.init();");
                                }
                                else
                                {
                                    componentDidMountMain.push("AOS.init();");
                                    componentDidMountPage.remove("AOS.init();");
                                }
                                break;
                            case "fancybox":
                                imports.push("import '@fancyapps/fancybox';");
                                dependencies.push("@fancyapps/fancybox");
                                break;
                            case "jqueryui":
                                imports.push("import 'jquery-ui';");
                                dependencies.push("jquery-ui");
                                break;
                            case "tiny-slider":
                                imports.push("import { tns } from '../../node_modules/tiny-slider/src/tiny-slider';");
                                dependencies.push("tiny-slider");
                                break;
                            case "glightbox":
                                imports.push("import GLightbox from 'glightbox';");
                                dependencies.push("glightbox");
                                if (!componentDidMountPage.includes("GLightbox"))
                                {
                                    componentDidMountPage.push("new GLightbox({selector: '.glightbox'});");
                                }
                                else
                                {
                                    componentDidMountMain.push("new GLightbox({selector: '.glightbox'});");
                                    componentDidMountPage.remove("new GLightbox({selector: '.glightbox'});");
                                }
                                break;
                            default:
                                break;
                        }

                        if (library === "bootstrap")
                        {
                            if (!dependencies.includes("@popperjs/core"))
                            {
                                dependencies.push("@popperjs/core");
                            }
                        }
                    }
                }

                if (importFile)
                {
                    let finalLink = link;
                    if (link.includes(".min"))
                    {
                        const jsFileNoExtension = link.split(".").shift();
                        const jsFileToFind = jsFileNoExtension.replace(".min", "");
                        const jsFile = findFile(jsFileToFind + ".js");
                        if (jsFile !== false)
                        {
                            finalLink = jsFile;
                        }
                    }

                    let jsFileContents = fs.readFileSync(finalLink, "utf8");
                    // Check if there is WOW.js in the file
                    if (jsFileContents.includes("new WOW().init();"))
                    {
                        // Strip out the WOW.js code
                        jsFileContents = jsFileContents.replace(/new WOW\(\)\.init\(\);/g, "");
                    }
                    componentDidMountPage.push(jsFileContents);
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
}

/**
 * Handle Inline Javascript
 */
function handleInlineJavascript(root)
{
    const inlineJsConvertLoader = load(logPrefix + " - Converting inline js to componentDidMount");
    const inlineJsTags = root.querySelectorAll("script:not([src])");
    for (let i = 0; i < inlineJsTags.length; i++)
    {
        const inlineJsTag = inlineJsTags[i];
        const fileContents = inlineJsTag.innerHTML;
        if (!fileContents.includes("WOW"))
        {
            if (!componentDidMountPage.includes(fileContents))
            {
                componentDidMountPage.push(fileContents);
            }
        }
        inlineJsTag.remove();
    }

    inlineJsConvertLoader.succeed(logPrefix + " - Converted inline js to componentDidMount");
}

/**
 * Handle inline styles
 */
function handleInlineStyles(root)
{
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
}

/**
 * Handle WOW.js
 */
function handleWow(root)
{
    // Detect wow.js from class
    const lookforWow = load(logPrefix + " - Detecting wow.js from class");
    const wowTags = root.querySelectorAll(".wow");
    if (wowTags.length > 0)
    {
        if (!dependencies.includes("wowjs"))
        {
            dependencies.push("react-wow");
        }
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
}

/**
 * Handle Meta
 */
function handleMeta(root)
{
    // Remove all meta tags
    const metaConversionLoader = load(logPrefix + " - Removing meta tags");
    const metaTags = root.querySelectorAll("meta");
    metaTags.forEach(metaTag =>
    {
        metaTag.remove();
    });

    metaConversionLoader.succeed(logPrefix + " - Removed meta tags");
}

/**
 * Handle  s
 */
function handleLinks(root)
{
    // Remove remaining <link> tags
    const linkConversionLoader = load(logPrefix + " - Removing link tags");
    const linkTags = root.querySelectorAll("link");
    linkTags.forEach(linkTag =>
    {
        linkTag.remove();
    });
    linkConversionLoader.succeed(logPrefix + " - Removed link tags");
}

/**
 * Handle pageLinks
 */
function handlePageLinks(root)
{
    const pageLinks = root.querySelectorAll("a");
    pageLinks.forEach(pageLink =>
    {
        const href = pageLink.getAttribute("href");
        let newHref = href;
        if (href && href.includes(".html"))
        {
            if (!imports.includes("import { Link } from 'react-router-dom';\n"))
            {
                imports.push("import { Link } from 'react-router-dom';\n");
            }

            if (href.includes("index.html"))
            {
                newHref = "/";
            }
            else
            {
                newHref = href.replace(".html", "");
            }

            // Remove href attribute and add "to" attribute
            pageLink.removeAttribute("href");
            pageLink.setAttribute("to", newHref);
        }
        else if (href && href.includes("javascript:"))
        {
            newHref = "/";
            // Remove href attribute and add "to" attribute
            pageLink.removeAttribute("href");
            pageLink.setAttribute("to", newHref);

            if (!imports.includes("import { Link } from 'react-router-dom';\n"))
            {
                imports.push("import { Link } from 'react-router-dom';\n");
            }
        }
    });

    // // Convert a to Link
    // const aConversionLoader = load(logPrefix + " - Converting a to Link");
    // const aTags = root.querySelectorAll("a");
    // aTags.forEach(aTag =>
    // {
    //     const href = aTag.getAttribute("href");
    //     const tag = "<Link to='" + href + "'>" + aTag.innerHTML + "</Link>";
    //     aTag.replaceWith(tag);
    // });

    // aConversionLoader.succeed(logPrefix + " - Converted a to Link");
}

/**
 * Convert HTML to JSX
 */
function convert(root, logPrefix, fileName)
{
    let pageTitle = handlePageTitle(root);

    if (componentDidMountPage.length > 0)
    {
        // Find images in componentDidMountPage
        const imgFormats = ["jpg", "jpeg", "png", "gif", "svg"];
        for (let i = 0; i < imgFormats.length; i++)
        {
            const imgFormat = imgFormats[i];
            if (componentDidMountPage.includes("." + imgFormat))
            {
                const imgNamePascalCase = fileName.charAt(0).toUpperCase() + fileName.slice(1);
                if (!imports.includes("import " + imgNamePascalCase + "Image from" + importImg + "/" + fileName + "." + imgFormat + "';\n"))
                {
                    imports.push("import " + imgNamePascalCase + "Image from" + importImg + "/" + fileName + "." + imgFormat + "';\n");
                }

                componentDidMountPage = componentDidMountPage.replace("." + imgFormat, "Image");
                break;
            }
        }
    }

    var JSXFunctionStart = createFunctionStart(fileName, pageTitle);

    const jsxConversionLoader = load(logPrefix + " - Converting to JSX");

    // Convert to JSX
    var converter = new HTMLtoJSX({
        createClass: false
    });

    var jsx = converter.convert(root.toString());

    // Replace reactwow with ReactWOW
    jsx = jsx.replace(/reactwow/g, "ReactWOW");

    // Replace link with Link
    jsx = jsx.replace(/link/g, "Link");

    const aTags = jsx.match(/<a.*?\/a>/g);
    if (aTags)
    {
        for (let i = 0; i < aTags.length; i++)
        {
            const aTag = aTags[i];
            if (aTag.includes("to="))
            {
                const newATag = aTag.replace(/<a/g, "<Link");
                const newATag2 = newATag.replace(/\/a>/g, "/Link>");
                jsx = jsx.replace(aTag, newATag2);
            }
        }
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

    // Remove quotes arround img src object
    jsx = jsx.replace(/src="(\{.*\})"/g, "src=$1");

    var JSXFunctionEnd = createFunctionEnd();

    const importsToString = imports.join("");

    let jsxToFormat = importsToString;

    jsxToFormat += JSXFunctionStart;
    jsxToFormat += jsx;
    jsxToFormat += JSXFunctionEnd;

    jsxConversionLoader.succeed(logPrefix + " - Converted to JSX");

    const formatLoader = load(logPrefix + " - Formatting");
    // Format JSX
    let formattedJSX = prettier.format(jsxToFormat, {
        semi: false,
        singleQuote: true,
        parser: "babel"
    });

    formatLoader.succeed(logPrefix + " - Formatted");

    return formattedJSX;
}

/**
 * Handle Component
 */
function handleComponent(name, contents)
{
    if (contents !== undefined && contents !== null)
    {
        // Create " + name + " Component
        if (fs.existsSync("./jsx/" + "./Components/" + name + ".jsx"))
        {
            fs.unlinkSync("./jsx/" + "./Components/" + name + ".jsx");
        }

        logPrefix = "" + name;
        const jsx = handleFile(contents, logPrefix, "" + name, false);

        const createFileLoader = load(logPrefix + " - Creating file");
        // Create new 
        fs.appendFileSync(conversionComponents + "/" + name + ".jsx", jsx);

        createFileLoader.succeed(logPrefix + " - Converted to ./jsx/" + "Components/" + name + ".jsx");

    }
}

/**
 * Convert all HTML files
 */
function convertAllHtml()
{
    fs.readdirSync("./").forEach(file =>
    {
        // If file is html
        if (file.endsWith(".html"))
        {
            // Read file
            var html = fs.readFileSync(file, 'utf8');
            const fileName = file.split(".")[0];
            logPrefix = file;

            const functionName = createFunction(fileName);

            const jsx = handleFile(html, logPrefix, functionName, true);

            const createFileLoader = load(logPrefix + " - Creating file");
            // Create new 
            fs.appendFileSync(conversionPages + "/" + functionName + ".jsx", jsx);

            createFileLoader.succeed(logPrefix + " - Converted to " + conversionPages + "/" + functionName + ".jsx");
        }
    });
}

function handleMainLayout()
{
    const mainLayoutLoader = load("Creating Main Layout");

    let MainLayoutContents = "import React from 'react';\n";
    if (HeaderContents !== undefined && HeaderContents !== null)
    {
        MainLayoutContents += "import Header from '../Components/Header';\n";
    }
    if (FooterContents !== undefined && FooterContents !== null)
    {
        MainLayoutContents += "import Footer from '../Components/Footer';\n";
    }

    if (SidebarContents !== undefined && SidebarContents !== null)
    {
        MainLayoutContents += "import Sidebar from '../Components/Sidebar';\n";
    }


    MainLayoutContents += "import { Outlet } from 'react-router-dom';\n";
    MainLayoutContents += "export default class Main extends React.Component {\n";
    if (componentDidMountMain.length > 0)
    {
        MainLayoutContents += "componentDidMount() {\n";
        MainLayoutContents += componentDidMountMain.join("\n");
        MainLayoutContents += "}\n";
    }
    MainLayoutContents += "    render() {\n";
    MainLayoutContents += "    return (\n";
    MainLayoutContents += "        <div>\n";

    if (HeaderContents !== undefined && HeaderContents !== null)
    {
        MainLayoutContents += "            <Header />\n";
    }

    if (SidebarContents !== undefined && SidebarContents !== null)
    {
        MainLayoutContents += "            <Sidebar />\n";
    }

    MainLayoutContents += "            <Outlet/>\n";

    if (FooterContents !== undefined && FooterContents !== null)
    {
        MainLayoutContents += "            <Footer />\n";
    }

    MainLayoutContents += "        </div>\n";

    MainLayoutContents += "    );\n";

    MainLayoutContents += "}\n";
    MainLayoutContents += "}\n";

    if (fs.existsSync(conversionLayouts + "/Main.jsx"))
    {
        fs.unlinkSync(conversionLayouts + "/Main.jsx");
    }

    fs.writeFileSync(conversionLayouts + "/Main.jsx", MainLayoutContents);

    mainLayoutLoader.succeed("Created Main Layout file");

}

/**
 * ===================== END UTILS =====================
 */

/**
 * Start migration
 */
log("Starting migration process: " + processName);

htmlExists();

checkProcess();

clearFolders();

function handleFile(html, logPrefix, name, findComponents)
{
    imports = [];
    componentDidMountPage = [];

    const root = HTMLParser.parse(html);

    const body = root.querySelector("body");
    if (body)
    {
        handleBody(body);
    }

    if (findComponents)
    {
        const componentsToExtract = [
            "header",
            "footer",
            "sidebar"
        ]

        for (let i = 0; i < componentsToExtract.length; i++)
        {
            const componentToExtract = componentsToExtract[i];
            const component = root.querySelector(componentToExtract);
            if (component)
            {
                const extractorLoader = load(logPrefix + " - Extracting " + componentToExtract);
                switch (componentToExtract)
                {
                    case "header":
                        HeaderContents = component;
                        component.remove();
                        break;
                    case "footer":
                        FooterContents = component;
                        component.remove();
                        break;
                    case "sidebar":
                        SidebarContents = component;
                        component.remove();
                        break;
                }

                extractorLoader.succeed(logPrefix + " - Extracted " + componentToExtract);
            }
        }
    }

    handleImages(root);

    handleInputs(root);

    handleStyles(root);

    handleJavascript(root);

    handleInlineJavascript(root);

    handleInlineStyles(root);

    handleWow(root);

    handleMeta(root);

    handleLinks(root);

    handlePageLinks(root);

    const jsx = convert(root, logPrefix, name);

    return jsx;
}

convertAllHtml();

handleComponent("Header", HeaderContents);
handleComponent("Footer", FooterContents);
handleComponent("Sidebar", SidebarContents);

handleMainLayout();

const viteproject = load("Creating vite project");

execute("yarn create vite vite --template react", function (output)
{
    viteproject.succeed("Created vite project");

    const copyLoader = load("Creating structure");
    // Remove default files
    fs.rmSync(viteFolder + "/src", { recursive: true });

    // Create main.jsx
    fs.mkdirSync(viteFolder + "/src");

    const pageImports = [];
    const pages = fs.readdirSync(conversionPages);
    pages.forEach(page =>
    {
        const pageName = page.split(".")[0];
        pageImports.push("import " + pageName + " from '" + importPages + "/" + pageName + "';");
    });

    pageImports.push("import Main from '" + importLayouts + "/Main';");

    const pageImportsToString = pageImports.join("\n");

    let mainJSX = "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport {createBrowserRouter,RouterProvider} from 'react-router-dom';" + pageImportsToString + "\n";

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
    fs.mkdirSync(viteFolder + "/src" + componentsFolder);
    const components = fs.readdirSync(conversionComponents);
    components.forEach(component =>
    {
        fs.copyFileSync(conversionComponents + "/" + component, viteFolder + "/src" + componentsFolder + "/" + component);
    });

    // Copy layouts
    fs.mkdirSync(viteFolder + "/src" + layoutsFolder);
    const layouts = fs.readdirSync(conversionLayouts);
    layouts.forEach(layout =>
    {
        fs.copyFileSync(conversionLayouts + "/" + layout, viteFolder + "/src" + layoutsFolder + "/" + layout);
    });

    // Copy pages
    fs.mkdirSync(viteFolder + "/src" + pagesFolder);
    pages.forEach(page =>
    {
        fs.copyFileSync(conversionPages + "/" + page, viteFolder + "/src" + pagesFolder + "/" + page);
    });

    // Copy assets
    fs.mkdirSync(viteFolder + "/src" + assetsFolder);
    fse.copySync(conversionAssets, viteFolder + "/src" + assetsFolder);

    copyFilesLoader.succeed("Copied files");

    let installLoader = load("Installing dependencies");
    execute("cd vite && yarn", function (success)
    {
        installLoader.succeed("Installed dependencies");

        // Installing dependencies: react-router-dom, react-wow
        let installDependenciesLoader = load("Adding dependencies: " + dependencies.join(", "));

        execute("cd vite && yarn add react-router-dom " + dependencies.join(" "), function (success)
        {
            installDependenciesLoader.succeed("Added dependencies: " + dependencies.join(", "));

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