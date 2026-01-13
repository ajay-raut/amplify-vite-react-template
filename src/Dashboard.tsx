import React, { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { uploadData, list, remove, getUrl } from 'aws-amplify/storage';

interface DashboardProps {
  user?: any;
}

// Define what a "File" looks like in our list
interface StorageFile {
  key: string;
  lastModified?: Date;
  size?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { signOut } = useAuthenticator((context) => [context.signOut]);
  
  // State for Uploads
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  
  // State for File List
  const [fileList, setFileList] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);

  // User Identifiers
  const userProfilePic = user?.attributes?.picture;
  const userName = user?.attributes?.name || user?.username || 'User';
  const userId = user?.username || 'unknown-user'; 

  // ==========================================
  // 1. FETCH FILES (List)
  // ==========================================
  const fetchFiles = async () => {
    try {
      setLoading(true);
      // List all files that start with "userID/"
      const result = await list({
        prefix: `${userId}/`,
      });
      setFileList(result.items);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching files:", error);
      setLoading(false);
    }
  };

  // Fetch files immediately when the component loads
  useEffect(() => {
    fetchFiles();
  }, [userId]);

  // ==========================================
  // 2. UPLOAD FILE
  // ==========================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploadStatus("Uploading...");
      const filePath = `${userId}/${file.name}`;

      await uploadData({
        key: filePath,
        data: file
      }).result;

      setUploadStatus(`Success!`);
      setFile(null);
      
      // Refresh the list immediately after upload
      fetchFiles(); 
    } catch (error) {
      console.error('Upload Error:', error);
      setUploadStatus("Upload Failed.");
    }
  };

  // ==========================================
  // 3. DELETE FILE
  // ==========================================
  const handleDelete = async (fileKey: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await remove({ key: fileKey });
      
      // OPTIONAL: Try to delete the associated summary file to keep bucket clean
      try {
        await remove({ key: `${fileKey}_summary.txt` });
      } catch (e) {
        // Ignore error if summary doesn't exist
      }

      // Refresh list after delete
      fetchFiles(); 
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file.");
    }
  };

  // ==========================================
  // 4. VIEW FILE (Generate Signed URL)
  // ==========================================
  const handleView = async (fileKey: string) => {
    try {
      // Get a temporary signed URL that expires in 5 minutes
      const link = await getUrl({
        key: fileKey,
        options: { expiresIn: 300 } // 300 seconds = 5 mins
      });
      
      // Open file in new tab
      window.open(link.url.toString(), '_blank');
    } catch (error) {
      console.error("View error:", error);
      alert("Could not generate download link.");
    }
  };

  // ==========================================
  // 5. VIEW SUMMARY (New Feature)
  // ==========================================
  const handleViewSummary = async (originalFileKey: string) => {
    // The backend Lambda saves summaries as "filename_summary.txt"
    const summaryKey = `${originalFileKey}_summary.txt`;
    
    try {
      // 1. Get a signed URL for the summary text file
      const link = await getUrl({ key: summaryKey, options: { expiresIn: 60 } });
      
      // 2. Fetch the text content directly
      const response = await fetch(link.url.toString());
      
      if (response.ok) {
        const text = await response.text();
        // Display summary in an Alert (or you could create a Modal)
        alert(`AI SUMMARY:\n\n${text}`); 
      } else {
        alert("Summary is currently being generated. Please wait 10-20 seconds and try again.");
      }
    } catch (error) {
      console.error("Summary fetch error", error);
      alert("No summary found. Ensure the file has been processed.");
    }
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
         <h2>Dashboard</h2>
         <button onClick={signOut} style={{ padding: '8px 16px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sign Out</button>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* User Info */}
        <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
           {userProfilePic && <img src={userProfilePic} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%' }} />}
           <div>
             <h3>Welcome, {userName}</h3>
             <p>User ID: {userId}</p>
           </div>
        </div>

        {/* Upload Section */}
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white', marginBottom: '30px' }}>
          <h3>Upload New File</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="file" onChange={handleFileChange} />
            <button 
              onClick={handleUpload}
              disabled={!file}
              style={{
                padding: '10px 20px',
                backgroundColor: file ? '#2e7d32' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: file ? 'pointer' : 'not-allowed'
              }}
            >
              Upload
            </button>
          </div>
          {uploadStatus && <p style={{ color: 'green', marginTop: '10px' }}>{uploadStatus}</p>}
        </div>

        {/* File List Section */}
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
          <h3>Your Files</h3>
          {loading ? <p>Loading files...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {fileList.length === 0 && <p style={{ color: '#777' }}>No files found.</p>}

              {/* FILTER: Hide the _summary.txt files from the main list */}
              {fileList
                .filter(item => !item.key.endsWith('_summary.txt'))
                .map((item) => (
                <div 
                  key={item.key} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '10px', 
                    backgroundColor: '#f9f9f9', 
                    border: '1px solid #eee',
                    borderRadius: '4px'
                  }}
                >
                  {/* File Name (Remove the folder prefix for display) */}
                  <span style={{ fontWeight: 500 }}>
                    {item.key.replace(`${userId}/`, '')}
                  </span>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    
                    {/* View Button */}
                    <button 
                      onClick={() => handleView(item.key)}
                      style={{ padding: '5px 10px', backgroundColor: '#0288d1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      View
                    </button>

                    {/* NEW: Summary Button (Purple) */}
                    <button 
                      onClick={() => handleViewSummary(item.key)}
                      style={{ padding: '5px 10px', backgroundColor: '#7b1fa2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Summary
                    </button>

                    {/* Delete Button */}
                    <button 
                      onClick={() => handleDelete(item.key)}
                      style={{ padding: '5px 10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;