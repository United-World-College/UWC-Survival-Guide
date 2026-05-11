---
title: "關於 Computer Science"
category: "UWC 之後的日子"
description: "從內部分支到職業路徑，重新理解 CS 這個學科。"
order: 2
author_id: "william-huang"
original_language: "zh-CN"
guide_id: "computer-science"
language_code: "zh-TW"
language_name: "台灣繁體"
language_folder: "chinese"
language_sort: 3
published: 2026-05-10
updated: 2026-05-10
math: true
---


這是專業篇的第一篇文章，這個系列的初衷是希望透過科普的形式向大家介紹不同學科在本科階段作為一個專業究竟是什麼樣的，有哪些細分領域以及哪些常見的 career path。第一篇我想先講一講 CS，帶著大家從大學的視角來看我對這個學科的理解究竟是什麼樣的，和我高中時候的認識有什麼不同。

我最開始對 CS 的興趣是小時候玩機器人的時候培養起來的，那時候會寫一些簡單的程式碼控制機器人完成一些 deterministic 的任務，我記得最開始就是樂高機器人的那種；後來我參加過一些演算法競賽，學習了一些 competitive programming 的技巧。接著在高中的時候又做過一兩個 AI 相關的小項目，這大概就是我上大學以前對 CS 這個學科的 mental model。但是上了大學以後我發現這個 mental model 立刻就 fall apart 了。現在回想起來那時候接觸的這些東西真的只是一些皮毛而已，CS 作為一個學科還是有很多不同的領域和值得研究的問題的。但這正是這個學科的最讓我欽佩的地方所在：它不像一些學科高高在上拒人於千里之外；恰恰相反，CS 透過自己不同層級的 abstraction 可以讓不同知識背景的人都參與其中，感受到它的魅力。比方說我相信本文的大部分讀者不一定懂得大模型的原理，但每天都在 benefit from it。然後對於稍微 advanced 一點的人來說可以 dive deeper，比如使用 coding agent 來寫程式做項目，或者是呼叫一個 LLM 的 API 來完成一些任務。接著有更多知識儲備的人可以在大模型這條線上繼續深挖，比方說對特定任務做微調，甚至是預訓練，開發相關演算法，研究相關數學理論等等。對於每個人來說都可以在大模型這個領域內有自己的一席之地。但其實大模型這條線只是目前比較 popular 的 AI 方向的一個子領域而已，除此之外這門學科還有很多其他分支和領域，比如系統、理論等。這也就是為什麼 CS 同時具有 vertical accessibility 和 horizontal heterogeneity。

說實話，CS 這門學科之所以具有 horizontal heterogeneity 是因為它本身就是數學、ECE、物理、語言學、認知科學等等很多學科高度耦合的產物。但也正因為如此，它內部不同的細分領域之間的界限往往是模糊的。對於具體怎麼分類，不同的視角會有不同的分類方法，但不同方法之間差距不會太大。在這裡我會參考 [CSRankings](https://csrankings.org/#/index?all&us) 這個網站上面的分類方法，從做 research 的角度來進行分析。

## 關於 CSRankings

在正式開始之前我想先簡單介紹一下 CSRankings。這個網站在 CS 圈子裡被公認是衡量學校科研實力的一個不錯參考，它的排名是完全按照每個學校的 faculty 在每個領域的頂會裡面發表文章的數量來進行加權計算的。這個計算方法相對公平，但也會有對應的問題。首先是它沒法區分 groundbreaking work 和 incremental work（這兩種在它的統計裡都算是一篇文章，也就是 publication += 1，但實際影響力可能差了好幾個數量級）；其次，它統計的是 conference 而不是 journal（順便提一下，CS 的 convention 是把文章優先發表在會議而不是期刊，因為 CS 技術迭代太快，期刊審稿週期往往是會議的幾倍，所以完全沒法跟上），但這種統計方式對個別偏好 journal 的教授和子領域（比如 biocomputing）來說就是一個巨大的 disadvantage；此外還有一點就是 faculty 數量多的學校天然佔優勢，因為假設兩個學校的教授的平均水平相同，那教授多的學校自然數值就會更高。但這一點也不完全是 bias，因為 faculty 多確實意味著 ecosystem 更厚。對於這些具體的問題我會留到之後的選校部分再慢慢展開，這裡只是先請讀者注意一下 CSRankings 並不是完美的排名，但它對了解每個學校的實力還是有重要參考價值的，而且它本身也是一個不錯的領域劃分指南。

好了現在言歸正傳。在 CSRankings 上 CS 這個學科大致被分成了四個大類：AI、Systems、Theory，以及一些 Interdisciplinary 的領域。雖說每個領域是相對自成一體的，對於每個領域甚至是內部的子領域的細分方向都會有各自的 community，但我一直覺得這四個 cluster 之間有一個邏輯上的附屬關係：Theory 是最 foundational 的部分，提供 algorithm 和 computation 本身的數學基礎；Systems 則是在 Theory 之上建立起了實際能運行的硬體和軟體 infrastructure；AI 又在 Systems 之上延伸出能從資料中學習的應用；Interdisciplinary 則是 CS 和其他學科（生物、經濟、藝術等）的交叉，一般來說會更加偏向應用一些。當然這些也都不是絕對的，像是 AI 這個領域裡面其實也存在著大量的理論研究方向，比如 learning theory 之類的。下面我會按照剛剛提出的這個邏輯順序依次介紹。

## Theory：CS 的數學基礎

Theory 這個領域大致在做的事情是研究 computation 本身的數學性質，也就是什麼問題能算、什麼問題算不出來、能算的問題需要多少 resource、怎麼 prove 一個 algorithm 是 optimal 的。這些都是 CS 這個學科的基石，為談論 computation 提供了具體的語言和工具。而在 CSRankings 上 theory 又被進一步分成三個子方向：Algorithms & Complexity、Cryptography 以及 Logic & Verification。

### Algorithms & Complexity

Algorithms & Complexity 是 theory 裡最經典的方向。我記得原來打演算法競賽的時候做每道題之前最重要一件事就是先看資料規模和題目的 constraint 來挑選合適的演算法，這樣才能保證在題目規定的時間複雜度以內解決問題。對於 research 而言這個 spirit 是一樣的，只不過要解決的問題會複雜很多：algorithm 研究的是怎麼設計更快的演算法解決具體問題，比如圖演算法、近似演算法、線上演算法、隨機演算法這些；complexity 則是反過來，研究的是某一類問題至少需要多少 resource（時間、空間、隨機性等等）才能被解決，給演算法設計畫一條理論上的下界。兩條線一個在往下推上界、一個在往上推下界，最終目標是把它們對齊。比如基於比較的排序的下界已經被證明是 $\Omega(n \log n)$，而 [merge sort](https://en.wikipedia.org/wiki/Merge_sort)、[heap sort](https://en.wikipedia.org/wiki/Heapsort) 這些演算法剛好都打到這個下界，那麼排序在比較模型下就算是有定論了。但很多更難的問題，比如[矩陣乘法](https://en.wikipedia.org/wiki/Matrix_multiplication_algorithm)、[全源最短路徑](https://en.wikipedia.org/wiki/Shortest_path_problem)，它們的上下界之間到現在還有不小的 gap，這就是 algorithm 和 complexity 這個領域一直在研究的東西。著名的 [P vs NP 問題](https://en.wikipedia.org/wiki/P_versus_NP_problem)就屬於 complexity 的範疇，而這道題懸而未決已經五十多年，被 [Clay 數學研究所](https://en.wikipedia.org/wiki/Clay_Mathematics_Institute)列為七個 [Millennium Prize Problems](https://en.wikipedia.org/wiki/Millennium_Prize_Problems) 之一。

### Cryptography

Cryptography 表面上像是 algorithm 的一個應用，但其實它有自己一整套獨立的理論框架。它研究的是怎麼在有對手存在的環境下保證資訊的機密性、完整性和真實性。這個方向特殊的地方在於 security 的定義都是建立在某個 complexity 假設之上的，比如 [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) 的安全性建立在大整數分解很難這一假設之上。所以 cryptography 和 complexity 是天然糾纏在一起的：你必須先有一個 hardness assumption，才能在它之上搭建 crypto scheme。近幾年這個領域比較火的方向有 [post-quantum cryptography](https://en.wikipedia.org/wiki/Post-quantum_cryptography)（擔心未來的量子電腦會破掉現在主流的 crypto，所以提前設計能抵抗量子攻擊的方案）、[zero-knowledge proof](https://en.wikipedia.org/wiki/Zero-knowledge_proof)（讓一方在不洩露任何額外資訊的前提下證明自己知道某個秘密，是很多 blockchain 系統的底層），以及 [multi-party computation](https://en.wikipedia.org/wiki/Secure_multi-party_computation) 等等。

### Logic & Verification

Logic & Verification 這條線相對小眾一些，但解決的問題非常實在：怎麼用 formal method 在數學層面證明一段程式、或者一個系統是正確的？比如一個 OS kernel、一個編譯器、一個分散式協定，怎麼保證它在所有輸入下都不會 crash、不會洩露資料、不會出現 race condition？這就是 verification 要回答的問題。這個方向和 PL（programming languages）社群有很深的交集，因為很多 verification 工具本身就建立在類型系統、operational semantics 這些 PL 概念之上。這個領域比較有名的成果之一是 [seL4](https://en.wikipedia.org/wiki/SeL4)，一個被完整形式化驗證過的 microkernel，能在數學上證明它的實現滿足一份規約，所以被廣泛用在軍用、航太這些高安全場景裡。

這一段對沒接觸過 verification 的讀者來說可能有點抽象，可以拿演算法競賽打個比方。在演算法競賽、日常軟體開發這些場景裡，驗證一段程式碼正不正確，靠的基本都是寫大量測試案例去跑一遍，而不是去做 formal verification。所謂測試案例其實很好理解，比方說我手上有一個函式 $f(x) = x^2$，那輸入 $2$ 就應該輸出 $4$，輸入 $3$ 就應該輸出 $9$，以此類推。所以只要寫大量測試案例來檢驗一個輸入是否能得到對應的輸出就可以了，成本相對 formal verification 來說很低。因為 testing 本質上只檢查有限 specific input 是否得到正確 output，而不是像 formal verification 那樣在數學上證明對所有可能的 input 程式都滿足要求。但現實裡的問題往往要複雜很多的，總會有測試案例沒覆蓋到的 corner case；對大部分軟體開發來說這些遺漏其實無傷大雅，我們每天在用的 Chrome 這類產品裡其實就存在著大量已知和未知的 bug，做這種產品的核心邏輯是快速迭代而不是萬無一失。這是一種 tradeoff，使用者可以忍一忍小毛病，下一版更新裡修一下就行了，但放到航空航太、加密貨幣這些場景裡，一個沒考慮到的 corner case 可能就直接出人命或者虧掉一大筆錢，這種時候才值得花成倍的成本去做 formal verification。

晶片設計其實也是同一個道理。一顆晶片一旦流片就沒法再打補丁了，做出來的幾百萬顆裡只要有一個 corner case 被觸發，可能就是整批召回的損失。一個經典的例子是 1994 年 Intel Pentium 的 [FDIV bug](https://en.wikipedia.org/wiki/Pentium_FDIV_bug)，因為浮點除法在某些極端輸入下會算錯，最後 Intel 花了將近五億美元做召回。所以現代晶片在 tape out 之前一般都會用大量 formal method 去證明設計在所有合法輸入下都滿足規約。

Theory 整體對數學背景的要求很高，平時的工作大多發生在白板上而不是在 IDE 裡，論文裡也幾乎全是證明而不是實驗。所以如果不是發自內心喜歡推理和證明，在這個方向上孤軍奮戰會比較辛苦。但反過來說，theory 的成果壽命也是 CS 裡最長的，一篇好的演算法論文常常會被引用幾十年，而 systems 和 AI 那邊因為技術迭代實在太快，五年前的 SOTA 現在可能已經沒人提了。

## Systems：讓 computation 真正跑起來

Systems 這個 cluster 是 CS 裡 footprint 最大的一塊，它涵蓋了幾乎所有讓 computation 真正能在硬體上跑起來所需要的基礎設施，從最底層的晶片設計一路往上到 OS、網路、資料庫、PL、SE 等等。systems 的研究風格和 theory 幾乎完全相反：theory 是在紙上推公式證定理，systems 則非常 hands-on，幾乎每篇論文都要做出一個真實的原型，再去測它的性能（延遲、吞吐量、功耗這些），用實測資料來支撐自己的結論。所以 systems 的論文經常會附帶很大體量的程式碼。

繼續從演算法競賽的角度來看的話，algorithm 做的就是如何降低時間複雜度，而 systems 當然也做讓演算法跑得更快這件事（也就是優化常數），但實際上它負責的事情要比這個雜得多，還包括怎麼讓多執行緒不出 race condition、機器掛掉怎麼不丟資料、給上層什麼樣的介面才好用等等。這些大多都跟跑得快不快沒什麼關係，但都是 systems 這條線要負責的事情。

CSRankings 把 systems 拆成了大約十幾個子方向，下面挑幾個比較有代表性的簡單聊聊。

### Computer Architecture

Computer Architecture 是 systems 裡最貼近硬體的方向，研究的是 CPU、GPU、TPU 這些晶片內部應該怎麼設計：cache 層級怎麼組織、指令集是 RISC 還是 CISC、流水線怎麼排、怎麼處理分支預測和記憶體一致性等等。最近幾年隨著 [Moore's Law](https://en.wikipedia.org/wiki/Moore%27s_law) 慢慢失速，單純堆電晶體的紅利已經幾乎沒有了，所以 architecture 這條線的精力大量轉向了為特定 workload（比如深度學習、圖計算、cryptography）設計專門的加速器。Google 的 [TPU](https://en.wikipedia.org/wiki/Tensor_Processing_Unit)、NVIDIA 的 [Tensor Core](https://en.wikipedia.org/wiki/Volta_(microarchitecture)) 都是這個趨勢的產物。

### Operating Systems

Operating Systems 主要研究 OS kernel 應該怎麼設計：怎麼調度行程、怎麼管理記憶體、怎麼處理 I/O、怎麼實現檔案系統等等。這個領域近些年比較活躍的幾個方向包括 unikernel（把應用和核心合併成一個單一目的的二進位檔來榨乾性能）、verified microkernel（在 microkernel 拆分架構的基礎上用 formal method 證明 kernel 核心實現的正確性，前面提到的 seL4 就是這條線上的代表），以及針對新硬體（比如 persistent memory、SmartNIC、disaggregated memory）做的 OS 改造。

### Networking

Networking 研究的是資料怎麼在機器之間高效可靠地傳輸：從區域網路內部的交換機設計，到跨資料中心的廣域網路，再到 Internet 上的路由協定，都屬於這個領域。這兩年這條線上很多研究都聚焦在資料中心網路上，因為雲端運算和大模型訓練的需求，大家越來越關心怎麼在資料中心內部做到極低延遲、不堵塞的通訊。

### High-Performance Computing

High-Performance Computing 研究的是怎麼把一份計算 scale 到上萬個節點上高效跑完。這條線傳統的 application 是解決科學問題，比如氣候模擬、流體力學、第一性原理材料計算，這些都是國家級超算每天在做的事，背後的數學本質是 PDE 求解、大規模線性代數這一類 numerical methods 的工作。說實話，我感覺 HPC 更像是 systems 領域裡集大成者於一身的方向，既和 architecture、network 這些方向高度交叉，又要特別關注應用數學裡的 numerical stability 這些細節。另外值得一提的是，這兩年大模型訓練其實就直接建立在 HPC 幾十年攢下來的基礎設施上。GPU 叢集、節點間高速互連、collective communication 這些本來就是 HPC 一直在做的事，整個大模型的訓練棧基本就是在這上面發展出來的。

這裡順帶提一下 numerical methods。它本質上是應用數學的一個分支，當放在 CS 裡面討論的時候它上面一層就是 scientific computing 這個更大的領域，scientific computing 除了 numerical methods 之外還包括 HPC 實現、計算物理／化學／生物這些領域科學，以及科學軟體工程。因為 numerical methods 最常落地的平台就是 HPC，所以這兩個 community 很多時候就是同一群人。其實 numerical methods 在做的事情很簡單，那就是解決數學和電腦本質上的錯位。這個錯位主要有兩個不同的來源。一個是連續和離散之間的差異：數學裡很多對象本質上是連續的，比如導數、積分、PDE 的解、矩陣的特徵值，但電腦只能處理離散、有限步的運算，所以導數得變成差分、積分得變成求和、PDE 得變成網格上的代數方程、特徵值得靠迭代去逼近。另一個錯位是 floating point 本身：電腦用浮點數近似實數，每一步都會丟一點 roundoff，規模一大就一路累積下去導致最後的計算結果可能就不能用了。Numerical methods 這個領域做的事就是要解決這兩個問題，讓演算法既能保證收斂性、效率上也不至於太離譜。

到了大模型時代，在訓練模型的時候連續和離散這一層其實基本不影響，因為訓練本身已經是離散的矩陣乘法，沒有什麼需要做離散化的連續對象，但 floating point 這一層是真正的核心問題。大模型訓練本質上就是海量浮點運算的累加，numerical stability 一旦沒處理好，loss 就會突然 spike、模型直接訓崩，動輒上千萬美元的損失。這也是為什麼 mixed precision（用 FP16 / BF16 / FP8 這些低精度格式提性能，但 FP16 自己就會帶來 stability 問題）、loss scaling（用來補 FP16 的 gradient underflow，BF16 因為指數位和 FP32 一樣寬通常用不上）、以及更精細的 scaling 策略這些 numerical-systems 交叉方向會是大模型訓練的重頭戲。

### Database

Database 研究的是怎麼存、怎麼索引、怎麼查詢大量資料。一個現代的資料庫系統要解決的問題非常多：怎麼在保證 [ACID](https://en.wikipedia.org/wiki/ACID) 的前提下做並行事務、怎麼把查詢分發到多台機器上、怎麼優化 SQL 查詢計劃、怎麼處理串流資料等等。這兩年比較火的方向有記憶體資料庫、雲端原生資料庫（像 [Snowflake](https://en.wikipedia.org/wiki/Snowflake_Inc.)、[BigQuery](https://en.wikipedia.org/wiki/BigQuery) 這種），以及專門為大模型 retrieval 設計的向量資料庫。

### Programming Languages

Programming Languages 研究的是程式語言本身：語言怎麼設計、類型系統怎麼搭、編譯器怎麼把高階程式碼翻譯成機器碼。不同語言其實代表著不同的設計 tradeoff，比如演算法競賽和高頻交易常用的 C++ 給了使用者完全的記憶體控制，速度很快但很容易 use-after-free、buffer overflow；Java、Python 這些用 garbage collector 接管記憶體，安全但有執行開銷；Rust 這幾年很火，靠 ownership 和 borrow checker 在編譯期就把記憶體安全檢查掉了，讓使用者既不用 GC 又能避開 C++ 那些最折磨人的錯誤。PL 這個領域和上面提到的 formal verification 有很深的交集，所以兩邊的社群有不少交流。

### Security

Security 這個子方向橫跨的層次很廣，從底層的硬體安全（比如 [Spectre](https://en.wikipedia.org/wiki/Spectre_(security_vulnerability))、[Meltdown](https://en.wikipedia.org/wiki/Meltdown_(security_vulnerability)) 這種側通道攻擊）到作業系統安全、網路安全，再到應用層的 web security 和 ML security，幾乎每一層都有自己的攻擊模型和防禦機制。

### Software Engineering

Software Engineering 研究的是大規模程式碼庫應該怎麼組織、怎麼測試、怎麼維護。這個領域因為 AI 的興起也變得非常活躍，比如程式合成、自動修 bug、自動寫測試案例都是當下挺熱的話題。需要說明的是，作為學術研究的 Software Engineering 和大廠裡我們常說的 SWE（軟體工程師）這個職業其實關係不大，只是名字一樣而已。而 SWE 究竟是什麼則會放在之後 career path 的部分詳談。

Systems 研究的問題大多來自真實的工程痛點，所以這個領域的學術界和工業界關係特別緊密。當然這也不是絕對的，像是剛才提到的 software engineering 就是一個反例：它作為 research topic 所關心的大規模程式碼庫應該怎麼組織、code review 怎麼 scale、CI/CD pipeline 怎麼設計這些問題，對於 Google 等大廠而言，因為自身 codebase 體量極大，早就 accumulate 了遠超學術界的一手經驗，相關 best practice 也往往是工業界先開發出來的。學術界裡 software engineering researcher 的獨特 contribution 是把這些 industry pattern 系統化，但最原始的 problem-solving frontier 確實往往都在工業界。

Systems 對人的要求和 theory 方向恰恰相反：它整體對工程能力的要求很高，平時的工作大多發生在終端和 profiler 裡而不是在白板上，論文裡也幾乎全是 benchmark 和實測資料而不是數學證明。所以如果沒有真的享受寫程式、和真實硬體死磕的過程，這個方向會顯得比較枯燥乏味。但從另一個角度來說，systems 的成果落地速度也是 CS 裡最快的之一，一篇有分量的 paper 幾年之內就有可能被工業界吸收成為標準實踐，在博士期間就有可能看到自己親手搭出來的系統真的被部署。

## AI：讓電腦從感知到決策

AI 是 CS 裡這幾年發展最快、關注度最高的方向，幾乎不用過多介紹。但 AI 內部其實也分了很多不同的子方向，下面簡單展開一下。

CSRankings 把 AI 大致分成 AI（general）、Computer Vision、Machine Learning & Data Mining、Natural Language Processing、Web & Information Retrieval 這幾個方向。但說實話，自從 [transformer](https://en.wikipedia.org/wiki/Transformer_(deep_learning)) 在 2017 年橫空出世、之後又催生出 GenAI 這一波浪潮以來，這些子方向之間的界限已經越來越模糊。以前 vision 和 NLP 是兩個相對獨立的社群，現在大家都用同一套 backbone（transformer）和同一套範式（pretrain + finetune），多模態模型也開始一統天下。所以下面我會按照現在實際的研究 landscape 來講，而不嚴格遵循 CSRankings 的分類。

### Foundation Model

Foundation Model 是這兩年最熱的方向。它的核心問題是怎麼訓練一個能在很多任務上泛化的模型，具體研究的子問題包括架構設計（attention 機制怎麼改、怎麼處理長上下文）、訓練（pretraining 的資料配比、scaling law、RLHF 這些）、推理（怎麼加速、怎麼量化、怎麼做 speculative decoding）以及評測（怎麼設計真正能衡量模型能力的 benchmark）等等。這個方向非常依賴算力，很多最前沿工作只能在 industry lab（OpenAI、Anthropic、Google DeepMind 等）裡做，因為學術界很難擁有訓練一個前沿模型所需要的那種規模的 GPU 叢集。

### Computer Vision

Computer Vision 研究模型怎麼理解圖像和影片，具體任務包括分類、檢測、分割、生成等等。在大模型時代之前，CV 是一個相對自洽的方向，有自己的 backbone（[ResNet](https://en.wikipedia.org/wiki/Residual_neural_network)、[ViT](https://en.wikipedia.org/wiki/Vision_transformer) 這些）和自己的任務集；但現在 vision 越來越多地被合併到多模態模型裡去了。生成這條線目前也很活躍，[diffusion model](https://en.wikipedia.org/wiki/Diffusion_model)、影片生成都是當下的熱點。

### Natural Language Processing

Natural Language Processing 研究模型怎麼理解和生成自然語言。這個領域基本已經被 LLM 重塑了。以前的 NLP 任務（翻譯、摘要、問答這些）現在都成了 LLM 的下游應用，所以 NLP 的研究重心也很大程度上轉移到了 LLM 本身的能力和對齊上。

### Reinforcement Learning

Reinforcement Learning 研究的是 agent 怎麼透過和環境互動學到一個最優策略。RL 在過去十年走過一段挺有意思的路：曾經它最有名的應用是下棋打遊戲（[AlphaGo](https://en.wikipedia.org/wiki/AlphaGo)、[AlphaStar](https://en.wikipedia.org/wiki/AlphaStar_(software))），後來一度被認為不太實用；但近兩年 [RLHF](https://en.wikipedia.org/wiki/Reinforcement_learning_from_human_feedback) 讓它在 LLM 訓練裡成了不可或缺的一環，又重新回到了聚光燈下。這兩年的 reasoning model（OpenAI 的 o 系列、DeepSeek 的 R 系列）更是把 RL 推到了 LLM 訓練流水線的中心位置。

### ML Theory

ML Theory 研究的是 ML 的數學性質：為什麼深度網路能泛化、optimization landscape 長什麼樣、為什麼過參數化的模型不會過擬合等等。這個方向和前面 theory 那部分其實有挺深的交集，需要很強的數學功底。

### AI for Science

AI for Science 是這幾年才崛起的一個交叉方向，主要把 ML 用在具體的科學問題上。最有名的例子是 DeepMind 的 [AlphaFold](https://en.wikipedia.org/wiki/AlphaFold)，它基本解決了 [protein structure prediction](https://en.wikipedia.org/wiki/Protein_structure_prediction) 這個生物學界懸而未決五十年的問題，並因此拿到了 2024 年的諾貝爾化學獎。除此之外 AI for math、AI for materials science 這些也都是越來越受關注的方向。順帶提一句，如何使用 AI 做前面在理論方向中提到的 formal verification 從而降低其成本其實就是現在 AI for math 這個領域內最重要的研究問題之一。

說實話我覺得 AI 這個方向更像是 theory 和 systems 融合的產物，跨度非常之廣。這個領域的研究既可以非常偏向理論又可以非常偏向系統。所以這也就對人的要求特別高。最頂尖的 AI researcher 往往都是數學和工程兩手都過硬的 full-stack researcher，既能推 scaling law 這些理論分析，又能在幾千張 GPU 上把一整套訓練流程穩定跑起來。這種 profile 在任何其他 CS 子領域裡都不算多見，但在 AI 領域幾乎已經成了頂級 lab 的標配。

此外，從個人發展的角度來說，AI 大概是目前 CS 裡錢最多、就業最好的方向之一，但與此同時也極度內捲、迭代極快，一篇 paper 掛到 arxiv 上，三個月之後可能就過時了。所以在這個方向待下去需要一種特別的心態：既要跟得上社群的節奏，又要在各種 hype 裡保持判斷力，不被裹挾。

## Interdisciplinary：CS 和其他學科的交叉

最後一個 cluster 是 interdisciplinary，也就是 CS 和別的學科之間的交叉地帶。這部分的子方向大多是把 CS 的方法和工具用到某個具體領域的問題上，所以做這條線一般需要雙重背景。下面挑幾個有代表性的方向簡單展開。

### Computational Biology / Bioinformatics

Computational Biology / Bioinformatics 是把 CS 用在生物學問題上的方向。具體的任務包括基因測序、蛋白質結構預測、藥物發現、單細胞分析這些，前面提到的 AlphaFold 也算這個領域的標誌性成果。這條線因為生物學本身的資料規模和複雜度都在飛速增長，加上 ML 工具又越來越強，未來很長一段時間大概率都會是一個增長方向。

### Computer Graphics

Computer Graphics 研究的是怎麼用電腦生成、表示、操作視覺內容，像電影特效、遊戲渲染、3D 建模、物理模擬都屬於這個範疇。近些年隨著 VR/AR 的發展和 generative model 的進步，這個領域也變得越來越活躍，比如 [NeRF](https://en.wikipedia.org/wiki/Neural_radiance_field)、[Gaussian Splatting](https://en.wikipedia.org/wiki/Gaussian_splatting) 這些技術就是把傳統 graphics 和現代 ML 結合起來的成功案例。

### Human-Computer Interaction

Human-Computer Interaction 研究的是人和電腦之間的互動：UI/UX 怎麼設計、accessibility 怎麼處理、AR/VR 怎麼做、新型輸入裝置怎麼設計。HCI 是 CS 裡最 user-facing 的方向之一，所以它的研究經常會涉及使用者研究、心理學這些傳統上不算 CS 的方法論。當然現在隨著 GenAI 的爆發也有不少人開始研究 AI 和人的互動以及對社會的影響，這些也都屬於 HCI 的範疇。

### Robotics

Robotics 研究的是怎麼讓物理 agent 在真實世界裡感知、推理、行動。這個領域天然橫跨 ML、控制理論、機械工程等好幾個學科。最近隨著 LLM 的進步，把 LLM 當作機器人的高層規劃器也成了一個挺活躍的研究方向。

### Economics & Computation

Economics & Computation 是 CS 和經濟學的交叉，某種程度上和 Operations Research 挺像的，研究的問題包括機制設計（比如一場拍賣怎麼設計才能讓大家誠實出價）、algorithmic game theory、市場設計這些。這條線和工業界的關係也挺緊密，Google、Meta 這些公司的廣告競價系統背後就有大量這方面的研究在支撐。

### Visualization

Visualization 研究的是怎麼把高維或者複雜的資料用人能看懂的方式展示出來。這個方向雖然小眾，但在資料科學、科學計算這些場景裡非常重要。

### CS Education

CS Education 研究的是 CS 應該怎麼教。具體研究的問題包括語言設計（怎麼設計一種對初學者友好的程式語言）、教學法（怎麼教抽象、怎麼教遞迴）以及 access equity（怎麼讓更多 underrepresented group 進入這個學科）等等。

Interdisciplinary 這個 cluster 整體的選擇面非常廣，適合那些除了 CS 還對某個具體領域有興趣的人。它另外一個好處是：因為問題來源比較多樣，funding 也比較分散，所以受單一領域 hype 週期的影響相對小一些。

回到文章開頭的問題：上了大學以後會發現 CS 是一門什麼樣的學科？對我自己來說最大的體會就是：CS 比高中階段接觸的 coding 和演算法競賽要廣得多。它既可以是一門極其數學的學科（比如 theory 的部分），也可以是一門極其工程的學科（比如 systems 的部分），還可以是一門和幾乎任何其他學科交叉的學科（甚至包括法律、哲學等等）。每個人都能在裡面找到一個適合自己背景和興趣的方向，這也是我開頭提到的 horizontal heterogeneity 的真正含義。

對於學弟學妹們來說這裡還有一點值得注意：上面對每個方向的介紹只是想讓大家對這個學科的 landscape 有一個基本的認識，並不是讓大家現在就想好 commit 到哪一個領域。其實我見過很多人即使到本科快結束了都還沒有一個特別 concrete 的想法，這完全沒問題。大部分人最後的 commitment 也只是因為覺得某個方向有前途，或者恰好收到了某個特定方向的教授或者公司崗位的 offer，就這麼定下來了。我介紹了這麼多只是希望大家對 CS 這門學科多一些了解，看看裡面有沒有哪個小角落讓自己 feel right，而不是要現在就給大家施加什麼壓力。

## CS 選校

在正式進入這章之前，我推薦讀者先行閱讀[〈關於選校〉]({{ '/guides/chinese/school-selection-TW/' | relative_url }})一篇，因為在這裡會使用到不少那一篇裡面已經介紹過的分析方法和結論。此外需要說明的一點是，這個 section 會延續之前 research 視角的領域分類方法，主要從做本科教學和學術研究的角度來分析各個學校。而就業導向的分析則會留到下一個 section。

首先是我個人覺得對於本科生而言不同學校的 CS program 大致可以放在一個 spectrum 上，一端是 math-heavy 的教學風格，另一端是 engineering-heavy 的教學風格。當然不同的教學風格其實某種程度上也反映了這個學校的 research 風格。

Math-heavy 的項目最典型的特徵是 theory 類課程在本科必修裡佔比高、math prerequisite 厚。典型代表是 Princeton、Cornell、Caltech 等學校，必修課會要求學生有很強的讀和寫 proof 的能力。這一類學校比較適合想做 ML theory、cryptography、formal methods 這種 math-heavy 方向的人。

Engineering-heavy 項目的典型特徵則是 systems 類課程在本科 curriculum 裡佔比高、必修課 project load 重、hands-on training 多。典型代表是 CMU、UIUC、Georgia Tech 等學校，畢業時學生一般會有大量系統程式設計的 hands-on 經驗。此外很多 mid-tier R1 在 systems 方向做得非常深，比如 NC State 和 UTK 的 engineering 文化重，這兩所學校在 HPC 方向都是頂尖的。這些學校比較適合想做 systems、industry-bound SWE、applied ML 的人。

中間地帶是像 MIT、Stanford、UC Berkeley 等這種 math 和 engineering 雙修的 culture，必修課同時包含 proof-heavy theory course 和 implementation-heavy systems course。但代價是必修 load 重，對於不少"普通優秀"的同學來說容易進退維谷。

對於大部分文理學院來說這個情況又會有所不同，他們的風格一般不會有這麼大的差異。正如我在[〈關於選校〉]({{ '/guides/chinese/school-selection-TW/' | relative_url }})一文中所提到的，因為文理學院的 lab 資源有限，所以他們 default 重視理論；但 Harvey Mudd 是個例外，他們的整個 program 是出名的 engineering-heavy。

對於看完之後開始糾結的學弟學妹而言，這個 spectrum 裡其實並沒有一個永遠正確的選項，我覺得它更像是一個 self-auditing tool：你需要誠實問自己 "我喜歡的是 proof 還是 implementation、是理論還是 applied science、是 mathematical clarity 還是 engineering elegance"，然後選 spectrum 上 fit 你的位置。當然對於比較好的 R1 CS program 而言，不論學校本身是 math-heavy 還是 engineering-heavy，在每個領域裡都會有世界級的教授，所以即使現在 commit 了一個教學重心沒那麼契合的學校，也可以多上一點自己感興趣的領域的選修課或者去找對應領域的專家一起做 research。這其實就是 faculty 數量多的一個非常大的好處。

在這裡順帶說一下 CSRankings 的一個 known limitation——一個學校的排名很大程度上反映的是 institutional total output 而不是 per-faculty quality，所以 faculty 數量少但人均水平高的 department 在排名上會被顯著 understate。這一點在之前介紹 CSRankings 時就 promise 過會在選校部分展開。Caltech 是這個 limitation 最典型的受害者：這個學校本身就非常小，一屆大概就 200 多個本科生；CS department 也是很小的，faculty 數量很少，所以就導致了他們雖然有著不少很厲害的教授，但是在 CSRankings 上的排名卻非常低。實際操作上，CSRankings 網站點開每個學校名字就會展開該校所有 faculty 的 count 列表，大家可以把每個學校頭部 faculty 的水平和學校總體排名結合起來一起看而不只是看 institutional 總分。當然，faculty 少的學校開設課程的多樣性必然就低，這也是一個需要重要考慮的 tradeoff。這一點在文理學院最為明顯。前面提到 LAC default 重視理論一部分原因是 lab 資源有限，而另一部分原因正是 faculty 數量小限制了選修課的覆蓋面。

接下來我想給對 research 感興趣的同學大概介紹一下每個學校的強勢領域。首先 Top 4 的 CMU、MIT、Stanford 和 UC Berkeley 就不用多說了，這四所學校在大部分主流方向都是最厲害的，基本不需要 audit specific subarea。對於除此之外的其他學校，AI 方向 University of Washington 是最好的，systems 方向最強的是 UIUC，而 theory 方向最好的則是 Princeton。但我們真的可以做這樣的排序嗎？這種 single-label 的描述當然是舒服的，因為它為讀者用最少的 cognitive cost 建立起來了一個 mental model，但實際上這是一個很不負責任的簡化。"在這個領域內某學校特別強"這句話的意思實際上更接近"這個學校在這個領域裡的 visibility 特別高 / historically 出名"，但絕不是"這個學校只在這個領域內強"，也不是"這個領域只有這一所強校"。所以假如各位讀者有一個自己具體感興趣的方向，建議直接上 CSRankings 選 specific subarea filter 來看看這個領域內的生態究竟是什麼樣的，而不是只憑這種粗略的 label。

當然 CSRankings 也不絕對，它反映的是一個學校歷史上的 publication record，沒法體現一個 program 當前的 trajectory。比如最近新招進來的 rising star 潛力無限但無法在資料裡體現，而已經離開的 senior faculty 反而還在 count。所以一個比較 practical 的補充辦法是去看一個 program 裡的 faculty 這幾年有沒有持續拿到 [Sloan Research Fellowship](https://en.wikipedia.org/wiki/Sloan_Research_Fellowship)、[NSF CAREER Award](https://en.wikipedia.org/wiki/National_Science_Foundation_CAREER_Award) 這一類 early-career award；這些獎都是同行評審出來的，相對能反映出業內對這群人未來幾年潛力的判斷。具體操作上不需要自己一個一個去翻系裡的網站，直接讓 AI agent（比如 Claude 或 ChatGPT 的 deep research 模式）幫你列出來就行，這種查找類的任務 AI 往往比人快得多也準得多。

此外，對於想做 research 的同學來說，[〈關於選校〉]({{ '/guides/chinese/school-selection-TW/' | relative_url }})一文裡的 ceiling × demand framework 在這裡直接適用。比如 UIC 的資料探勘、猶他大學的圖形學這些 field-specific 頂尖的 mid-tier program 就是 CS sweet spot 的典型樣例。這樣 sweet spot 的例子在 CS 裡還有很多，具體情況還請各位讀者結合自身情況具體分析。
