
<img width="1302" height="578" alt="NetSeaDFLogo_normal-Picsart-AiImageEnhancer" src="https://github.com/user-attachments/assets/4fa2887d-ea19-46f6-9559-fe5356ece896" />


<img width="1904" height="1071" alt="NetSeaDF1" src="https://github.com/user-attachments/assets/40385650-ec46-420e-9bc4-5a34447f34c1" />
<img width="1292" height="659" alt="Screenshot 2026-06-05 140034" src="https://github.com/user-attachments/assets/88f47d88-8515-4c8c-816c-91dd84edd92d" />
<img width="1902" height="1068" alt="Screenshot 2026-05-30 003212" src="https://github.com/user-attachments/assets/cf712c04-e2f9-499b-ae99-685128146f45" />
<img width="1902" height="1070" alt="Screenshot 2026-05-30 003249" src="https://github.com/user-attachments/assets/dddb2740-32a9-460d-86d1-604a1bfa8389" />


NetSeaDF, a cross-platform desktop application for geospatial mapping and data visualization of ARGO float datasets.
## Additional information
This application is made in accordance with research needs of the Opera Lab at University Of Rhode Island's Graduate School Of Oceanography.

Developed during URI GSO's OECI B2OE Program.

## Features
* Importing multiple datasets
* Displaying datasets on a map
* Filtering platforms by time & location
* Visualizing Float Profile Timelines
* Viewing graphs of multiple datasets
* SSP and TEMP contrasting plots
* Simple SSP plotting across a time range
* Importing and exporting plotting data from user generated graphs



## User Download / Setup
### Step 1, browse the releases page
<img width="1452" height="1011" alt="step1" src="https://github.com/user-attachments/assets/9d9aaef4-4b95-48c9-927b-e42900f53ee9" />

## Step 2, click on the desired version
<img width="1428" height="1072" alt="image" src="https://github.com/user-attachments/assets/4402b0a4-9871-431e-879d-7b1392b72198" />

## Step 3, click on the desired file
<img width="1081" height="611" alt="step3" src="https://github.com/user-attachments/assets/a235522e-d7b6-4466-a78f-eb5682761fb3" />
.exe for Windows, .dmg for Mac, (Source Code is available as well if desired)

## Mac Installation Notice:
Mac computers have very strict security features that activate when installing applications.
Depending on how an application is installed, mac computers will either grant the app high permissions or minimal permissions. This can cause issues.
It is important to follow these installation steps when installing NetSeaDF on mac.
* Open the ``.dmg`` after installing.
* (It should show a popup with the apps icon and an arrow instructing you to install the app to the Applications folder).
* In the popup, drag the NetSeaDF app icon into the Applications folder icon.
* Wait for the copy to finish.
* Open Applications and launch NetSeaDF from there.
* Do not launch NetSeaDF from the mounted .dmg.
* After confirming it opens from the Applications folder, eject the mounted .dmg.
(So to sum it all up: do not run the app from the mounted .dmg; copy it into Applications first.)

## Done!
By this point, when you install the software, it should be good to go!


## Development Installation / Setup
### Prerequisites
- Node.js and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NickFran/NetSeaDF.git
cd NetSeaDF
```

Next, decide whether you want to use the built-in venv, or create your own. If using the built-in one, d0 2.A, if building your own venv from scratch, do 2.B

2.A Install dependencies:
```bash
npm install
```
2.B Install dependencies (Custom):
```bash
npm install
pip install -r requirements.txt
```

3. Run in development mode:
```bash
npm start
```


### Build Commands

```bash
# Build for Windows only
npm run build

# Build for macOS only
npm run build:mac

# Build for both platforms
npm run build:all
```

### Build Outputs

Built installers will be in the `output/` folder:
- Windows: `NetSeaDF Setup X.X.X.exe`
- macOS: `NetSeaDF-X.X.X.dmg`

### Notes
- **macOS builds from Windows**: You can build macOS installers on Windows, but they won't be code-signed
- **First-time macOS users**: Will need to right-click the app and select "Open" to bypass Gatekeeper
- **Architecture support**: Separate Python distributions are required for Intel vs Apple Silicon Macs

