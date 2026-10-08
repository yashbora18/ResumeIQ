import { useEffect, useRef, useState } from "react";

import {

  AlertCircle,

  CheckCircle2,

  Clock3,

  Download,

  FileText,

  LoaderCircle,

  MoreVertical,

  RefreshCw,

  Search,

  Trash2,

  Upload,

  X,

} from "lucide-react";



import DashboardLayout from "../dashboard/DashboardLayout";



import {

  deleteResume,

  downloadResume,

  getResumes,

  uploadResume,

} from "../../services/resumeService";



import "./Resume.css";



function Resume() {

  const fileInputRef = useRef(null);



  const [resumes, setResumes] = useState([]);

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState("");

  const [showUploadModal, setShowUploadModal] =

    useState(false);

  const [selectedFile, setSelectedFile] = useState(null);

  const [dragActive, setDragActive] = useState(false);

  const [menuId, setMenuId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  const [toast, setToast] = useState(null);



  async function loadResumes() {

  try {

    setLoading(true);

    setError("");



    const data = await getResumes();



    const resumeItems = Array.isArray(data)

      ? data

      : Array.isArray(data?.items)

        ? data.items

        : [];



    setResumes(resumeItems);

  } catch (err) {

    setError(

      err instanceof Error

        ? err.message

        : "Unable to load your resumes."

    );

  } finally {

    setLoading(false);

  }

}




  useEffect(() => {

    loadResumes();

  }, []);



  useEffect(() => {

    if (!toast) {

      return undefined;

    }



    const timer = window.setTimeout(() => {

      setToast(null);

    }, 4500);



    return () => window.clearTimeout(timer);

  }, [toast]);



  function showToast(type, message) {

    setToast({

      type,

      message,

    });

  }



  function openUploadModal() {

    setSelectedFile(null);

    setShowUploadModal(true);

    setError("");

  }



  function closeUploadModal() {

    if (uploading) {

      return;

    }



    setShowUploadModal(false);

    setSelectedFile(null);

    setDragActive(false);

  }



  function validateFile(file) {

    if (!file) {

      return "Please select a file.";

    }



    const extension = file.name

      .split(".")

      .pop()

      ?.toLowerCase();



    if (!["pdf", "docx"].includes(extension)) {

      return "Only PDF and DOCX files are supported.";

    }



    if (file.size > 5 * 1024 * 1024) {

      return "File size must not exceed 5 MB.";

    }



    if (file.size === 0) {

      return "The selected file is empty.";

    }



    return "";

  }



  function handleFileSelect(file) {

    const validationError = validateFile(file);



    if (validationError) {

      setSelectedFile(null);

      showToast("error", validationError);

      return;

    }



    setSelectedFile(file);

  }



  function handleInputChange(event) {

    const file = event.target.files?.[0];



    if (file) {

      handleFileSelect(file);

    }



    event.target.value = "";

  }



  function handleDragOver(event) {

    event.preventDefault();

    setDragActive(true);

  }



  function handleDragLeave(event) {

    event.preventDefault();

    setDragActive(false);

  }



  function handleDrop(event) {

    event.preventDefault();

    setDragActive(false);



    const file = event.dataTransfer.files?.[0];



    if (file) {

      handleFileSelect(file);

    }

  }



  async function handleUpload() {

    if (!selectedFile) {

      showToast(

        "error",

        "Choose a PDF or DOCX resume first."

      );

      return;

    }



    const validationError = validateFile(selectedFile);



    if (validationError) {

      showToast("error", validationError);

      return;

    }



    try {

      setUploading(true);



      const uploaded = await uploadResume(selectedFile);



      setResumes((current) => [

        uploaded,

        ...current,

      ]);



      setShowUploadModal(false);

      setSelectedFile(null);



      showToast(

        "success",

        `${selectedFile.name} uploaded successfully.`

      );



      window.dispatchEvent(
        new CustomEvent("resumeiq:notifications-updated")
      );

      await loadResumes();

    } catch (err) {

      showToast(

        "error",

        err instanceof Error

          ? err.message

          : "Unable to upload your resume."

      );

    } finally {

      setUploading(false);

    }

  }



async function handleDownload(resume) {
  try {
    setMenuId(null);

    const blob = await downloadResume(resume.id);

    if (!blob || blob.size === 0) {
      throw new Error(
        "The resume file is empty or unavailable."
      );
    }

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download =
      resume.original_filename ||
      "resume";

    anchor.style.display = "none";

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    showToast(
      "success",
      "Resume download started."
    );
  } catch (err) {
    showToast(
      "error",
      err instanceof Error
        ? err.message
        : "Unable to download the resume."
    );
  }
}



  async function handleDelete() {

    if (!deleteTarget) {

      return;

    }



    try {

      setDeleting(true);



      await deleteResume(deleteTarget.id);



      setResumes((current) =>

        current.filter(

          (resume) =>

            resume.id !== deleteTarget.id

        )

      );



      showToast(

        "success",

        `${deleteTarget.original_filename} was deleted.`

      );



      setDeleteTarget(null);

    } catch (err) {

      showToast(

        "error",

        err instanceof Error

          ? err.message

          : "Unable to delete the resume."

      );

    } finally {

      setDeleting(false);

    }

  }



  const filteredResumes = resumes.filter(

    (resume) =>

      resume.original_filename

        ?.toLowerCase()

        .includes(search.trim().toLowerCase())

  );



const completedCount = resumes.filter(
  (resume) =>
    resume.processing_status === "parsed" ||
    resume.processing_status === "completed"
).length;



const processingCount = resumes.filter(
  (resume) =>
    resume.processing_status === "uploaded" ||
    resume.processing_status === "processing"
).length;



  function formatFileSize(bytes) {

    if (!bytes) {

      return "0 KB";

    }



    if (bytes < 1024 * 1024) {

      return `${Math.max(

        1,

        Math.round(bytes / 1024)

      )} KB`;

    }



    return `${(

      bytes /

      (1024 * 1024)

    ).toFixed(1)} MB`;

  }



  function formatDate(dateValue) {

    if (!dateValue) {

      return "—";

    }



    const date = new Date(dateValue);



    if (Number.isNaN(date.getTime())) {

      return "—";

    }



    return new Intl.DateTimeFormat("en-IN", {

      day: "2-digit",

      month: "short",

      year: "numeric",

    }).format(date);

  }



  function getStatusLabel(status) {

    const labels = {

      completed: "Completed",

      parsed: "Completed",

      uploaded: "Uploaded",

      processing: "Processing",

      failed: "Failed",

    };



    return (

      labels[status?.toLowerCase()] ||

      status ||

      "Unknown"

    );

  }



  function getStatusClass(status) {

    const normalized =

      status?.toLowerCase();



    if (
  normalized === "completed" ||
  normalized === "parsed"
) {
  return "resume-status resume-status--success";
}



    if (

      normalized === "uploaded" ||
      normalized === "processing"

    ) {

      return "resume-status resume-status--pending";

    }



    if (normalized === "failed") {

      return "resume-status resume-status--error";

    }



    return "resume-status";

  }



  return (

    <DashboardLayout>

      <main className="resume-page">

        <section className="resume-page__header">

          <div>

            <span className="resume-page__eyebrow">

              RESUME LIBRARY

            </span>



            <h1>My Resumes</h1>



            <p>

              Manage your uploaded resumes and keep your

              career documents organized in one workspace.

            </p>

          </div>



          <button

            type="button"

            className="resume-upload-button"

            onClick={openUploadModal}

          >

            <Upload size={17} />

            Upload resume

          </button>

        </section>



        <section className="resume-summary">

          <article className="resume-summary-card">

            <div className="resume-summary-card__icon resume-summary-card__icon--teal">

              <FileText size={19} />

            </div>



            <div>

              <strong>{resumes.length}</strong>

              <span>Total resumes</span>

            </div>

          </article>



          <article className="resume-summary-card">

            <div className="resume-summary-card__icon resume-summary-card__icon--green">

              <CheckCircle2 size={19} />

            </div>



            <div>

              <strong>{completedCount}</strong>

              <span>Completed</span>

            </div>

          </article>



          <article className="resume-summary-card">

            <div className="resume-summary-card__icon resume-summary-card__icon--amber">

              <Clock3 size={19} />

            </div>



            <div>

              <strong>{processingCount}</strong>

              <span>In progress</span>

            </div>

          </article>

        </section>



        <section className="resume-toolbar">

          <div className="resume-search">

            <Search size={17} />



            <input

              type="search"

              value={search}

              onChange={(event) =>

                setSearch(event.target.value)

              }

              placeholder="Search resumes..."

              aria-label="Search resumes"

            />



            {search && (

              <button

                type="button"

                onClick={() => setSearch("")}

                aria-label="Clear search"

              >

                <X size={15} />

              </button>

            )}

          </div>



          <button

            type="button"

            className="resume-refresh-button"

            onClick={loadResumes}

            disabled={loading}

          >

            <RefreshCw

              size={16}

              className={

                loading

                  ? "resume-refresh-button__spin"

                  : ""

              }

            />

            Refresh

          </button>

        </section>



        {loading ? (

          <section className="resume-state">

            <LoaderCircle

              size={27}

              className="resume-state__spinner"

            />



            <strong>Loading your resumes</strong>



            <span>

              Fetching your ResumeIQ documents...

            </span>

          </section>

        ) : error ? (

          <section className="resume-state resume-state--error">

            <div className="resume-state__icon">

              <AlertCircle size={22} />

            </div>



            <strong>

              We couldn't load your resumes

            </strong>



            <span>{error}</span>



            <button

              type="button"

              onClick={loadResumes}

            >

              <RefreshCw size={15} />

              Try again

            </button>

          </section>

        ) : filteredResumes.length === 0 ? (

          <section className="resume-empty">

            <div className="resume-empty__icon">

              <FileText size={27} />

            </div>



            {search ? (

              <>

                <h2>No resumes found</h2>



                <p>

                  No uploaded resume matches “{search}”.

                </p>



                <button

                  type="button"

                  onClick={() => setSearch("")}

                >

                  Clear search

                </button>

              </>

            ) : (

              <>

                <h2>Build your resume library</h2>



                <p>

                  Upload your first PDF or DOCX resume to

                  start analyzing your professional profile.

                </p>



                <button

                  type="button"

                  onClick={openUploadModal}

                >

                  <Upload size={16} />

                  Upload your first resume

                </button>

              </>

            )}

          </section>

        ) : (

          <section className="resume-list">

            <div className="resume-list__header">

              <div>

                <span>

                  YOUR DOCUMENTS

                </span>



                <strong>

                  {filteredResumes.length}{" "}

                  {filteredResumes.length === 1

                    ? "resume"

                    : "resumes"}

                </strong>

              </div>

            </div>



            <div className="resume-table">

              <div className="resume-table__head">

                <span>Resume</span>

                <span>Type</span>

                <span>Status</span>

                <span>Uploaded</span>

                <span>Size</span>

                <span />

              </div>



              {filteredResumes.map((resume) => (

                <article

                  className="resume-row"

                  key={resume.id}

                >

                  <div className="resume-row__name">

                    <div className="resume-file-icon">

                      <FileText size={18} />

                    </div>



                    <div>

                      <strong

                        title={

                          resume.original_filename

                        }

                      >

                        {resume.original_filename ||

                          "Untitled resume"}

                      </strong>



                      <span>

                        Resume #{resume.id}

                      </span>

                    </div>

                  </div>



                  <span className="resume-file-type">

                    {resume.file_type?.toUpperCase() ||

                      "FILE"}

                  </span>



                  <span

                    className={getStatusClass(

                      resume.processing_status

                    )}

                  >

                    <span className="resume-status__dot" />

                    {getStatusLabel(

                      resume.processing_status

                    )}

                  </span>



                  <span className="resume-row__date">

                    {formatDate(

                      resume.uploaded_at

                    )}

                  </span>



                  <span className="resume-row__size">

                    {formatFileSize(

                      resume.file_size

                    )}

                  </span>



                  <div className="resume-row__actions">

                    <button

                      type="button"

                      onClick={() =>

                        handleDownload(resume)

                      }

                      aria-label={`Download ${resume.original_filename}`}

                      title="Download"

                    >

                      <Download size={16} />

                    </button>



                    <button

                      type="button"

                      onClick={() =>

                        setMenuId(

                          menuId === resume.id

                            ? null

                            : resume.id

                        )

                      }

                      aria-label="More actions"

                      title="More actions"

                    >

                      <MoreVertical size={17} />

                    </button>



                    {menuId === resume.id && (

                      <div className="resume-row__menu">

                        <button

                          type="button"

                          onClick={() => {

                            setMenuId(null);

                            setDeleteTarget(

                              resume

                            );

                          }}

                        >

                          <Trash2 size={15} />

                          Delete resume

                        </button>

                      </div>

                    )}

                  </div>

                </article>

              ))}

            </div>

          </section>

        )}



        {toast && (

          <div

            className={`resume-toast resume-toast--${toast.type}`}

            role="status"

          >

            {toast.type === "success" ? (

              <CheckCircle2 size={18} />

            ) : (

              <AlertCircle size={18} />

            )}



            <span>{toast.message}</span>



            <button

              type="button"

              onClick={() => setToast(null)}

              aria-label="Dismiss notification"

            >

              <X size={15} />

            </button>

          </div>

        )}

      </main>



      {showUploadModal && (

        <div

          className="resume-modal-backdrop"

          onMouseDown={(event) => {

            if (

              event.target ===

              event.currentTarget

            ) {

              closeUploadModal();

            }

          }}

        >

          <div

            className="resume-upload-modal"

            role="dialog"

            aria-modal="true"

            aria-labelledby="resume-upload-title"

          >

            <div className="resume-upload-modal__header">

              <div>

                <span>

                  RESUME UPLOAD

                </span>



                <h2 id="resume-upload-title">

                  Add a resume

                </h2>

              </div>



              <button

                type="button"

                onClick={closeUploadModal}

                disabled={uploading}

                aria-label="Close upload dialog"

              >

                <X size={19} />

              </button>

            </div>



            <p className="resume-upload-modal__description">

              Upload a PDF or DOCX resume. Maximum file

              size is 5 MB.

            </p>



            <div

              className={`resume-dropzone ${

                dragActive

                  ? "resume-dropzone--active"

                  : ""

              } ${

                selectedFile

                  ? "resume-dropzone--selected"

                  : ""

              }`}

              onDragOver={handleDragOver}

              onDragLeave={handleDragLeave}

              onDrop={handleDrop}

            >

              {selectedFile ? (

                <>

                  <div className="resume-dropzone__selected-icon">

                    <FileText size={24} />

                  </div>



                  <strong>

                    {selectedFile.name}

                  </strong>



                  <span>

                    {formatFileSize(

                      selectedFile.size

                    )}

                  </span>



                  <button

                    type="button"

                    onClick={() =>

                      setSelectedFile(null)

                    }

                    disabled={uploading}

                  >

                    Choose another file

                  </button>

                </>

              ) : (

                <>

                  <div className="resume-dropzone__icon">

                    <Upload size={24} />

                  </div>



                  <strong>

                    Drop your resume here

                  </strong>



                  <span>

                    or select a PDF or DOCX from your

                    computer

                  </span>



                  <button

                    type="button"

                    onClick={() =>

                      fileInputRef.current?.click()

                    }

                  >

                    Choose file

                  </button>

                </>

              )}



              <input

                ref={fileInputRef}

                type="file"

                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

                onChange={handleInputChange}

                hidden

              />

            </div>



            <div className="resume-upload-modal__footer">

              <button

                type="button"

                className="resume-modal-cancel"

                onClick={closeUploadModal}

                disabled={uploading}

              >

                Cancel

              </button>



              <button

                type="button"

                className="resume-modal-upload"

                onClick={handleUpload}

                disabled={

                  uploading || !selectedFile

                }

              >

                {uploading ? (

                  <>

                    <LoaderCircle

                      size={17}

                      className="resume-upload-spinner"

                    />

                    Uploading...

                  </>

                ) : (

                  <>

                    <Upload size={17} />

                    Upload resume

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}



      {deleteTarget && (

        <div

          className="resume-modal-backdrop"

          onMouseDown={(event) => {

            if (

              event.target ===

              event.currentTarget &&

              !deleting

            ) {

              setDeleteTarget(null);

            }

          }}

        >

          <div

            className="resume-delete-modal"

            role="dialog"

            aria-modal="true"

            aria-labelledby="resume-delete-title"

          >

            <div className="resume-delete-modal__icon">

              <Trash2 size={22} />

            </div>



            <h2 id="resume-delete-title">

              Delete this resume?

            </h2>



            <p>

              This will permanently remove{" "}

              <strong>

                {deleteTarget.original_filename}

              </strong>{" "}

              and its associated resume data.

            </p>



            <div className="resume-delete-modal__actions">

              <button

                type="button"

                onClick={() =>

                  setDeleteTarget(null)

                }

                disabled={deleting}

              >

                Cancel

              </button>



              <button

                type="button"

                onClick={handleDelete}

                disabled={deleting}

              >

                {deleting ? (

                  <>

                    <LoaderCircle

                      size={16}

                      className="resume-upload-spinner"

                    />

                    Deleting...

                  </>

                ) : (

                  <>

                    <Trash2 size={16} />

                    Delete resume

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </DashboardLayout>

  );

}



export default Resume;