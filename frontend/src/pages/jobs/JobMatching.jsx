import { useEffect, useMemo, useState } from "react";



import {



  AlertCircle,



  ArrowRight,



  BriefcaseBusiness,



  CheckCircle2,



  ChevronDown,



  Clock3,



  FileText,



  LoaderCircle,



  RefreshCw,



  Sparkles,



  Target,



  Trash2,



  TrendingUp,



  X,



} from "lucide-react";







import DashboardLayout from "../dashboard/DashboardLayout";







import {



  createJobMatch,



  deleteJobMatch,



  getJobMatchStatistics,



  getJobMatches,



  getResumesForJobMatching,



} from "../../services/jobMatchService";







import "./JobMatching.css";







function isResumeReady(resume) {

  const status = String(

    resume?.processing_status || ""

  ).toLowerCase();



  return (

    status === "parsed" ||

    status === "completed"

  );

}



function JobMatching() {



  const [resumes, setResumes] = useState([]);



  const [selectedResumeId, setSelectedResumeId] =



    useState("");



  const [matches, setMatches] = useState([]);



  const [statistics, setStatistics] =



    useState(null);







  const [form, setForm] = useState({



    job_title: "",



    company_name: "",



    job_description: "",



  });







  const [loading, setLoading] = useState(true);



  const [matchesLoading, setMatchesLoading] =



    useState(false);



  const [submitting, setSubmitting] =



    useState(false);



  const [error, setError] = useState("");



  const [toast, setToast] = useState(null);



  const [showResumeMenu, setShowResumeMenu] =



    useState(false);



  const [expandedMatchId, setExpandedMatchId] =



    useState(null);



  const [deletingMatchId, setDeletingMatchId] =



    useState(null);







  async function loadPage() {



    try {



      setLoading(true);



      setError("");







      const resumeList =



        await getResumesForJobMatching();







      setResumes(resumeList);







      if (resumeList.length === 0) {



        setSelectedResumeId("");



        setMatches([]);



        setStatistics(null);



        return;



      }







      const readyResume = resumeList.find(

        (resume) => isResumeReady(resume)

      );



      setSelectedResumeId((current) => {

        const exists = resumeList.some(

          (resume) =>

            String(resume.id) === String(current)

        );



        if (exists) {

          return current;

        }



        return readyResume

          ? String(readyResume.id)

          : String(resumeList[0].id);

      });



    } catch (err) {



      setError(



        err instanceof Error



          ? err.message



          : "Unable to load job matching."



      );



    } finally {



      setLoading(false);



    }



  }







  async function loadMatches(resumeId) {



    if (!resumeId) {



      return;



    }







    try {



      setMatchesLoading(true);







      const [history, stats] =



        await Promise.all([



          getJobMatches(resumeId),



          getJobMatchStatistics(resumeId),



        ]);







      setMatches(



        Array.isArray(history?.items)



          ? history.items



          : []



      );







      setStatistics(stats || null);



    } catch (err) {



      showToast(



        "error",



        err instanceof Error



          ? err.message



          : "Unable to load job matches."



      );







      setMatches([]);



      setStatistics(null);



    } finally {



      setMatchesLoading(false);



    }



  }







  useEffect(() => {



    loadPage();



  }, []);







  useEffect(() => {



    if (selectedResumeId) {



      loadMatches(selectedResumeId);



    }



  }, [selectedResumeId]);







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







  const selectedResume = useMemo(



    () =>



      resumes.find(



        (resume) =>



          String(resume.id) ===



          String(selectedResumeId)



      ),



    [resumes, selectedResumeId]



  );







  const parsedResumes = useMemo(

    () =>

      resumes.filter((resume) =>

        isResumeReady(resume)

      ),

    [resumes]

  );







  function handleFormChange(event) {



    const { name, value } = event.target;







    setForm((current) => ({



      ...current,



      [name]: value,



    }));



  }







  async function handleSubmit(event) {



    event.preventDefault();







    if (!selectedResume) {



      showToast(



        "error",



        "Please select a resume."



      );



      return;



    }







    if (!isResumeReady(selectedResume)) {

      showToast(

        "error",

        "Select a parsed or completed resume before matching a job."

      );

      return;

    }







    const jobTitle = form.job_title.trim();



    const companyName =



      form.company_name.trim();



    const jobDescription =



      form.job_description.trim();







    if (!jobTitle || !jobDescription) {



      showToast(



        "error",



        "Job title and job description are required."



      );



      return;



    }







    try {



      setSubmitting(true);







      const result = await createJobMatch(



        selectedResume.id,



        {



          job_title: jobTitle,



          company_name:



            companyName || null,



          job_description: jobDescription,



        }



      );







      setForm({



        job_title: "",



        company_name: "",



        job_description: "",



      });







      setMatches((current) => [



        result,



        ...current,



      ]);







      await loadMatches(



        selectedResume.id



      );







      setExpandedMatchId(result?.id);







      showToast(



        "success",



        "Job match generated successfully."



      );



      window.dispatchEvent(
        new CustomEvent("resumeiq:notifications-updated")
      );

    } catch (err) {



      showToast(



        "error",



        err instanceof Error



          ? err.message



          : "Unable to generate the job match."



      );



    } finally {



      setSubmitting(false);



    }



  }







  async function handleDelete(matchId) {



    if (!selectedResume) {



      return;



    }







    try {



      setDeletingMatchId(matchId);







      await deleteJobMatch(



        selectedResume.id,



        matchId



      );







      setMatches((current) =>



        current.filter(



          (match) => match.id !== matchId



        )



      );







      setExpandedMatchId(null);







      const stats =



        await getJobMatchStatistics(



          selectedResume.id



        );







      setStatistics(stats);







      showToast(



        "success",



        "Job match deleted successfully."



      );



    } catch (err) {



      showToast(



        "error",



        err instanceof Error



          ? err.message



          : "Unable to delete this job match."



      );



    } finally {



      setDeletingMatchId(null);



    }



  }







  function formatDate(value) {



    if (!value) {



      return "—";



    }







    const date = new Date(value);







    if (Number.isNaN(date.getTime())) {



      return "—";



    }







    return new Intl.DateTimeFormat(



      "en-IN",



      {



        day: "2-digit",



        month: "short",



        year: "numeric",



      }



    ).format(date);



  }







  function getScoreTone(score) {



    if (score >= 75) {



      return "strong";



    }







    if (score >= 60) {



      return "moderate";



    }







    return "weak";



  }







  function getScoreLabel(score) {



    if (score >= 75) {



      return "Strong match";



    }







    if (score >= 60) {



      return "Moderate match";



    }







    return "Needs work";



  }







  function getStatusLabel(status) {



    const labels = {



      uploaded: "Uploaded",



      parsed: "Ready",



      processing: "Processing",



      completed: "Completed",



      failed: "Failed",



    };







    return (



      labels[status] ||



      status ||



      "Unknown"



    );



  }







  if (loading) {



    return (



      <DashboardLayout>



        <main className="job-page job-page--state">



          <div className="job-loading">



            <LoaderCircle



              size={29}



              className="job-spinner"



            />







            <strong>



              Loading job intelligence



            </strong>







            <span>



              Fetching your resumes and matching history...



            </span>



          </div>



        </main>



      </DashboardLayout>



    );



  }







  if (error) {



    return (



      <DashboardLayout>



        <main className="job-page job-page--state">



          <div className="job-error">



            <div className="job-error__icon">



              <AlertCircle size={23} />



            </div>







            <h2>



              We couldn't load Job Matching



            </h2>







            <p>{error}</p>







            <button



              type="button"



              onClick={loadPage}



            >



              <RefreshCw size={16} />



              Try again



            </button>



          </div>



        </main>



      </DashboardLayout>



    );



  }







  if (resumes.length === 0) {



    return (



      <DashboardLayout>



        <main className="job-page">



          <section className="job-empty">



            <div className="job-empty__icon">



              <BriefcaseBusiness size={29} />



            </div>







            <span className="job-eyebrow">



              CAREER MATCHING



            </span>







            <h1>



              Find where your resume fits.



            </h1>







            <p>



              Upload and parse a resume first.



              ResumeIQ will then compare it with



              real job descriptions and show you



              exactly where you match.



            </p>



          </section>



        </main>



      </DashboardLayout>



    );



  }







  return (



    <DashboardLayout>



      <main className="job-page">



        <section className="job-header">



          <div>



            <span className="job-eyebrow">



              CAREER INTELLIGENCE



            </span>







            <h1>Job Matching</h1>







            <p>



              Compare your resume against a real job



              description and understand your fit before



              you apply.



            </p>



          </div>







          <button



            type="button"



            className="job-refresh"



            onClick={() =>



              selectedResumeId &&



              loadMatches(selectedResumeId)



            }



          >



            <RefreshCw size={16} />



            Refresh



          </button>



        </section>







        <section className="job-selector-bar">



          <div className="job-selector">



            <span className="job-selector__label">



              MATCHING RESUME



            </span>







            <button



              type="button"



              className="job-selector__button"



              onClick={() =>



                setShowResumeMenu(



                  (current) => !current



                )



              }



            >



              <div className="job-selector__file">



                <FileText size={17} />



              </div>







              <div>



                <strong>



                  {selectedResume?.original_filename}



                </strong>







                <span>



                  Resume #{selectedResume?.id} ·{" "}



                  {getStatusLabel(



                    selectedResume?.processing_status



                  )}



                </span>



              </div>







              <ChevronDown size={17} />



            </button>







            {showResumeMenu && (



              <div className="job-selector__menu">



                {resumes.map((resume) => (



                  <button



                    type="button"



                    key={resume.id}



                    onClick={() => {



                      setSelectedResumeId(



                        String(resume.id)



                      );



                      setShowResumeMenu(false);



                    }}



                  >



                    <FileText size={16} />







                    <span>



                      <strong>



                        {resume.original_filename}



                      </strong>







                      <small>



                        #{resume.id} ·{" "}



                        {getStatusLabel(



                          resume.processing_status



                        )}



                      </small>



                    </span>







                    {String(resume.id) ===



                      String(



                        selectedResumeId



                      ) && (



                      <CheckCircle2



                        size={16}



                      />



                    )}



                  </button>



                ))}



              </div>



            )}



          </div>







          <div className="job-selector-stats">



            <div>



              <strong>



                {statistics?.total_matches ??



                  matches.length}



              </strong>







              <span>Matches</span>



            </div>







            <div>



              <strong>



                {statistics?.average_score



                  ? Math.round(



                      statistics.average_score



                    )



                  : 0}



              </strong>







              <span>Avg score</span>



            </div>







            <div>



              <strong>



                {statistics?.highest_score ??



                  0}



              </strong>







              <span>Best score</span>



            </div>



          </div>



        </section>







        <section className="job-workspace">



          <article className="job-form-card">



            <div className="job-card-heading">



              <div className="job-card-heading__icon">



                <BriefcaseBusiness size={19} />



              </div>







              <div>



                <span className="job-eyebrow">



                  NEW MATCH



                </span>







                <h2>



                  Compare against a job



                </h2>



              </div>



            </div>







            <p className="job-form-intro">



              Paste a real job description and



              ResumeIQ will evaluate the selected



              resume against it.



            </p>







            {parsedResumes.length === 0 ? (



              <div className="job-form-warning">



                <AlertCircle size={17} />







                <span>



                  None of your resumes are parsed yet.



                  Job matching becomes available after



                  resume parsing completes.



                </span>



              </div>



            ) : (



              <form



                className="job-form"



                onSubmit={handleSubmit}



              >



                <div className="job-form-row">



                  <label>



                    Job title



                    <input



                      name="job_title"



                      type="text"



                      value={form.job_title}



                      onChange={



                        handleFormChange



                      }



                      placeholder="e.g. Python Backend Developer"



                      disabled={submitting}



                    />



                  </label>







                  <label>



                    Company



                    <input



                      name="company_name"



                      type="text"



                      value={



                        form.company_name



                      }



                      onChange={



                        handleFormChange



                      }



                      placeholder="e.g. Acme Technologies"



                      disabled={submitting}



                    />



                  </label>



                </div>







                <label>



                  Job description



                  <textarea



                    name="job_description"



                    value={



                      form.job_description



                    }



                    onChange={



                      handleFormChange



                    }



                    placeholder="Paste the complete job description here..."



                    rows={10}



                    disabled={submitting}



                  />



                </label>







                <div className="job-form-footer">



                  <span>



                    <Sparkles size={14} />



                    Powered by your ResumeIQ resume



                    intelligence



                  </span>







                  <button



                    type="submit"



                    className="job-submit"



                    disabled={submitting}



                  >



                    {submitting ? (



                      <>



                        <LoaderCircle



                          size={17}



                          className="job-spinner"



                        />



                        Analyzing...



                      </>



                    ) : (



                      <>



                        Analyze match



                        <ArrowRight



                          size={17}



                        />



                      </>



                    )}



                  </button>



                </div>



              </form>



            )}



          </article>







          <aside className="job-stats-card">



            <div className="job-card-heading">



              <div className="job-card-heading__icon job-card-heading__icon--blue">



                <TrendingUp size={19} />



              </div>







              <div>



                <span className="job-eyebrow">



                  MATCH HEALTH



                </span>







                <h2>



                  Your matching profile



                </h2>



              </div>



            </div>







            <div className="job-stat-main">



              <strong>



                {statistics?.average_score



                  ? Math.round(



                      statistics.average_score



                    )



                  : 0}



              </strong>







              <span>/100 average</span>



            </div>







            <div className="job-stat-breakdown">



              <div>



                <span>Strong</span>



                <strong>



                  {statistics?.strong_matches ??



                    0}



                </strong>



              </div>







              <div>



                <span>Moderate</span>



                <strong>



                  {statistics?.moderate_matches ??



                    0}



                </strong>



              </div>







              <div>



                <span>Weak</span>



                <strong>



                  {statistics?.weak_matches ??



                    0}



                </strong>



              </div>



            </div>



          </aside>



        </section>







        <section className="job-history">



          <div className="job-section-heading">



            <div>



              <span className="job-eyebrow">



                MATCH HISTORY



              </span>







              <h2>



                Your job comparisons



              </h2>



            </div>







            <span>



              {matches.length} saved{" "}



              {matches.length === 1



                ? "match"



                : "matches"}



            </span>



          </div>







          {matchesLoading ? (



            <div className="job-history-loading">



              <LoaderCircle



                size={22}



                className="job-spinner"



              />







              Loading match history...



            </div>



          ) : matches.length === 0 ? (



            <div className="job-history-empty">



              <Target size={25} />







              <strong>



                No job matches yet



              </strong>







              <span>



                Analyze your first real job description



                above to see your fit here.



              </span>



            </div>



          ) : (



            <div className="job-match-list">



              {matches.map((match) => {



                const tone =



                  getScoreTone(



                    match.match_score



                  );







                const expanded =



                  expandedMatchId ===



                  match.id;







                return (



                  <article



                    className={`job-match-card job-match-card--${tone}`}



                    key={match.id}



                  >



                    <button



                      type="button"



                      className="job-match-card__main"



                      onClick={() =>



                        setExpandedMatchId(



                          expanded



                            ? null



                            : match.id



                        )



                      }



                    >



                      <div className="job-match-card__icon">



                        <BriefcaseBusiness



                          size={18}



                        />



                      </div>







                      <div className="job-match-card__title">



                        <strong>



                          {match.job_title}



                        </strong>







                        <span>



                          {match.company_name ||



                            "Company not specified"}



                          {" · "}



                          {formatDate(



                            match.created_at



                          )}



                        </span>



                      </div>







                      <div className="job-match-score">



                        <strong>



                          {Math.round(



                            Number(



                              match.match_score ||



                                0



                            )



                          )}



                        </strong>







                        <span>



                          {getScoreLabel(



                            Number(



                              match.match_score ||



                                0



                            )



                          )}



                        </span>



                      </div>







                      <ChevronDown



                        className={



                          expanded



                            ? "job-chevron job-chevron--open"



                            : "job-chevron"



                        }



                        size={18}



                      />



                    </button>







                    {expanded && (



                      <div className="job-match-details">



                        <div className="job-detail-section">



                          <span>



                            MATCHING SKILLS



                          </span>







                          {Array.isArray(



                            match.matching_skills



                          ) &&



                          match.matching_skills



                            .length > 0 ? (



                            <div className="job-tags job-tags--success">



                              {match.matching_skills.map(



                                (



                                  item,



                                  index



                                ) => (



                                  <span



                                    key={`${item}-${index}`}



                                  >



                                    {item}



                                  </span>



                                )



                              )}



                            </div>



                          ) : (



                            <p>



                              No matching skills



                              returned.



                            </p>



                          )}



                        </div>







                        <div className="job-detail-section">



                          <span>



                            MISSING SKILLS



                          </span>







                          {Array.isArray(



                            match.missing_skills



                          ) &&



                          match.missing_skills



                            .length > 0 ? (



                            <div className="job-tags job-tags--warning">



                              {match.missing_skills.map(



                                (



                                  item,



                                  index



                                ) => (



                                  <span



                                    key={`${item}-${index}`}



                                  >



                                    {item}



                                  </span>



                                )



                              )}



                            </div>



                          ) : (



                            <p>



                              No missing skills



                              returned.



                            </p>



                          )}



                        </div>







                        <div className="job-detail-section">



                          <span>



                            MATCHING KEYWORDS



                          </span>







                          {Array.isArray(



                            match.matching_keywords



                          ) &&



                          match.matching_keywords



                            .length > 0 ? (



                            <div className="job-tags">



                              {match.matching_keywords.map(



                                (



                                  item,



                                  index



                                ) => (



                                  <span



                                    key={`${item}-${index}`}



                                  >



                                    {item}



                                  </span>



                                )



                              )}



                            </div>



                          ) : (



                            <p>



                              No matching keywords



                              returned.



                            </p>



                          )}



                        </div>







                        <div className="job-detail-section">



                          <span>



                            MISSING KEYWORDS



                          </span>







                          {Array.isArray(



                            match.missing_keywords



                          ) &&



                          match.missing_keywords



                            .length > 0 ? (



                            <div className="job-tags job-tags--warning">



                              {match.missing_keywords.map(



                                (



                                  item,



                                  index



                                ) => (



                                  <span



                                    key={`${item}-${index}`}



                                  >



                                    {item}



                                  </span>



                                )



                              )}



                            </div>



                          ) : (



                            <p>



                              No missing keywords



                              returned.



                            </p>



                          )}



                        </div>







                        <div className="job-detail-section">



                          <span>



                            RECOMMENDATIONS



                          </span>







                          {Array.isArray(



                            match.recommendations



                          ) &&



                          match.recommendations



                            .length > 0 ? (



                            <ol className="job-recommendations">



                              {match.recommendations.map(



                                (



                                  item,



                                  index



                                ) => (



                                  <li



                                    key={`${item}-${index}`}



                                  >



                                    <span>



                                      {index +



                                        1}



                                    </span>







                                    <p>



                                      {item}



                                    </p>



                                  </li>



                                )



                              )}



                            </ol>



                          ) : (



                            <p>



                              No recommendations



                              returned.



                            </p>



                          )}



                        </div>







                        <div className="job-match-actions">



                          <span>



                            <Clock3



                              size={14}



                            />



                            Match saved{" "}



                            {formatDate(



                              match.created_at



                            )}



                          </span>







                          <button



                            type="button"



                            onClick={() =>



                              handleDelete(



                                match.id



                              )



                            }



                            disabled={



                              deletingMatchId ===



                              match.id



                            }



                          >



                            {deletingMatchId ===



                            match.id ? (



                              <LoaderCircle



                                size={14}



                                className="job-spinner"



                              />



                            ) : (



                              <Trash2



                                size={14}



                              />



                            )}







                            Delete



                          </button>



                        </div>



                      </div>



                    )}



                  </article>



                );



              })}



            </div>



          )}



        </section>







        {toast && (



          <div



            className={`job-toast job-toast--${toast.type}`}



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



    </DashboardLayout>



  );



}







export default JobMatching;