---
title: "关于 Computer Science"
category: "UWC 之后的日子"
description: "从内部分支到职业路径，重新理解 CS 这个学科。"
order: 2
author_id: "william-huang"
original_language: "zh-CN"
guide_id: "computer-science"
language_code: "zh-CN"
language_name: "简体中文"
language_folder: "chinese"
language_sort: 2
published: 2026-05-10
updated: 2026-05-10
math: true
---


这是专业篇的第一篇文章，这个系列的初衷是希望通过科普的形式向大家介绍不同学科在本科阶段作为一个专业究竟是什么样的，有哪些细分领域以及哪些常见的 career path。第一篇我想先讲一讲 CS，带着大家从大学的视角来看我对这个学科的理解究竟是什么样的，和我高中时候的认识有什么不同。

我最开始对 CS 的兴趣是小时候玩机器人的时候培养起来的，那时候会写一些简单的代码控制机器人完成一些 deterministic 的任务，我记得最开始就是乐高机器人的那种；后来我参加过一些算法竞赛，慢慢学习了一些 competitive programming 的技巧。接着在高中的时候又做过一两个 AI 相关的小项目，这大概就是我上大学以前对 CS 这个学科的 mental model。但是上了大学以后我发现这个 mental model 立刻就 fall apart 了。现在回想起来那时候接触的这些东西真的只是一些皮毛而已，CS 作为一个学科还是有很多不同的领域和值得研究的问题的。但这正是这个学科的最让我钦佩的地方所在：它不像一些学科高高在上拒人于千里之外；恰恰相反，CS 通过自己不同层级的 abstraction 可以让不同知识背景的人都参与其中，感受到它的魅力。比方说我相信本文的大部分读者不一定懂得大模型的原理，但每天都在 benefit from it。然后对于稍微 advanced 一点的人来说可以 dive deeper，比如使用 coding agent 来写代码做项目，或者是调用一个 LLM 的 API 来完成一些任务。接着有更多知识储备的人可以在大模型这条线上继续深挖，比方说对特定任务做微调，甚至是预训练，开发相关算法，研究相关数学理论等等。对于每个人来说都可以在大模型这个领域内有自己的一席之地。但其实大模型这条线只是目前比较 popular 的 AI 方向的一个子领域而已，除此之外这门学科还有很多其他分支和领域，比如系统、理论等。这也就是为什么 CS 同时具有 vertical accessibility 和 horizontal heterogeneity。

接下来我想谈谈 CS 内究竟有哪些方向以及每个方向大概都是做什么的。其实 CS 这个学科本来就是数学、ECE、物理、语言学、认知科学等等很多学科高度耦合的产物，所以里面不同的细分领域之间的界限往往是模糊的，对于具体怎么分类，不同的视角也会有不同的分类方法，但不同方法之间差距不会太大。在这里我会参考 [CSRankings](https://csrankings.org/#/index?all&us) 这个网站上面的分类方法，从做 research 的角度来进行分析。

## 关于 CSRankings

在正式开始之前我想先简单介绍一下 CSRankings。这个网站在 CS 圈子里被公认是衡量学校科研实力的一个不错参考，它的排名是完全按照每个学校的 faculty 在每个领域的顶会里面发表文章的数量来进行加权计算的。这个计算方法相对公平，但也会有对应的问题。首先是它没法区分 groundbreaking work 和 incremental work（这两种在它的统计里都算是一篇文章，也就是 publication += 1，但实际影响力可能差了好几个数量级）；其次，它统计的是 conference 而不是 journal（顺便提一下，CS 的 convention 是把文章优先发表在会议而不是期刊，因为 CS 技术迭代太快，期刊审稿周期往往是会议的几倍，所以完全没法跟上），但这种统计方式对个别偏好 journal 的教授和子领域（比如 biocomputing）来说就是一个巨大的 disadvantage；此外还有一点就是 faculty 数量多的学校天然占优势，因为假设两个学校的教授的平均水平相同，那教授多的学校自然数值就会更高。但这一点也不完全是 bias，因为 faculty 多确实意味着 ecosystem 更厚。对于这些具体的问题我会留到之后的选校部分再慢慢展开，这里只是先请读者注意一下 CSRankings 并不是完美的排名，但它对了解每个学校的实力还是有重要参考价值的，而且它本身也是一个不错的领域划分指南。

好了现在言归正传。在 CSRankings 上 CS 这个学科大致被分成了四个大类：AI、Systems、Theory，以及一些 Interdisciplinary 的领域。虽说每个领域是相对自成一体的，对于每个领域甚至是内部的子领域的细分方向都会有各自的 community，但我一直觉得这四个 cluster 之间有一个逻辑上的附属关系：Theory 是最 foundational 的部分，提供 algorithm 和 computation 本身的数学基础；Systems 则是在 Theory 之上建立起了实际能运行的硬件和软件 infrastructure；AI 又在 Systems 之上延伸出能从数据中学习的应用；Interdisciplinary 则是 CS 和其他学科（生物、经济、艺术等）的交叉，一般来说会更加偏向应用一些。当然这些也都不是绝对的，像是 AI 这个领域里面其实也存在着大量的理论研究方向，比如 learning theory 之类的。下面我会按照刚刚提出的这个逻辑顺序依次介绍。

## Theory：CS 的数学基础

Theory 这个领域大致在做的事情是研究 computation 本身的数学性质，也就是什么问题能算、什么问题算不出来、能算的问题需要多少 resource、怎么 prove 一个 algorithm 是 optimal 的。这些都是 CS 这个学科的基石，为谈论 computation 提供了具体的语言和工具。而在 CSRankings 上 theory 又被进一步分成三个子方向：Algorithms & Complexity、Cryptography 以及 Logic & Verification。

Algorithms & Complexity 是 theory 里最经典的方向。我记得原来打算法竞赛的时候做每道题之前最重要一件事就是先看数据规模和题目的 constrain 来挑选合适的算法，这样才能保证在题目规定的时间复杂度以内解决问题。对于 research 而言这个 spirit 是一样的，只不过要解决的问题会复杂很多：algorithm 研究的是怎么设计更快的算法解决具体问题，比如图算法、近似算法、在线算法、随机算法这些；complexity 则是反过来，研究的是某一类问题至少需要多少 resource（时间、空间、随机性等等）才能被解决，给算法设计画一条理论上的下界。两条线一个在往上推上界、一个在往下推下界，最终目标是把它们对齐。比如基于比较的排序的下界已经被证明是 $\Omega(n \log n)$，而 [merge sort](https://en.wikipedia.org/wiki/Merge_sort)、[heap sort](https://en.wikipedia.org/wiki/Heapsort) 这些算法刚好都打到这个下界，那么排序在比较模型下就算是有定论了。但很多更难的问题，比如[矩阵乘法](https://en.wikipedia.org/wiki/Matrix_multiplication_algorithm)、[最短路径](https://en.wikipedia.org/wiki/Shortest_path_problem)，它们的上下界之间到现在还有不小的 gap，这就是 algorithm 和 complexity 这个领域一直在攻关的东西。著名的 [P vs NP 问题](https://en.wikipedia.org/wiki/P_versus_NP_problem)就属于 complexity 的范畴，而这道题悬而未决已经五十多年，被 [Clay 数学研究所](https://en.wikipedia.org/wiki/Clay_Mathematics_Institute)列为七个 [Millennium Prize Problems](https://en.wikipedia.org/wiki/Millennium_Prize_Problems) 之一。

Cryptography 表面上像是 algorithm 的一个应用，但其实它有自己一整套独立的理论框架。它研究的是怎么在有对手存在的环境下保证信息的机密性、完整性和真实性。这个方向特殊的地方在于 security 的定义都是建立在某个 complexity 假设之上的，比如 [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) 的安全性建立在大整数分解很难这一假设之上。所以 cryptography 和 complexity 是天然纠缠在一起的：你必须先有一个 hardness assumption，才能在它之上搭建 crypto scheme。近几年这个领域比较火的方向有 [post-quantum cryptography](https://en.wikipedia.org/wiki/Post-quantum_cryptography)（担心未来的量子计算机会破掉现在主流的 crypto，所以提前设计能抵抗量子攻击的方案）、[zero-knowledge proof](https://en.wikipedia.org/wiki/Zero-knowledge_proof)（让一方在不泄露任何额外信息的前提下证明自己知道某个秘密，是很多 blockchain 系统的底层），以及 [multi-party computation](https://en.wikipedia.org/wiki/Secure_multi-party_computation) 等等。

Logic & Verification 这条线相对小众一些，但解决的问题非常实在：怎么用 formal method 在数学层面证明一段程序、或者一个系统是正确的？比如一个 OS kernel、一个编译器、一个分布式协议，怎么保证它在所有输入下都不会 crash、不会泄露数据、不会出现 race condition？这就是 verification 要回答的问题。这个方向和 PL（programming languages）社区有很深的交集，因为很多 verification 工具本身就建立在类型系统、operational semantics 这些 PL 概念之上。这个领域比较有名的成果之一是 [seL4](https://en.wikipedia.org/wiki/L4_microkernel_family)，一个被完整形式化验证过的 microkernel，能在数学上证明它的实现满足一份规约，所以被广泛用在军事、航天这些高安全场景里。

这一段对没接触过 verification 的读者来说可能有点抽象，可以拿算法竞赛打个比方。在算法竞赛、日常软件开发这些场景里，验证一段代码正不正确，靠的基本都是写大量测试用例去跑一遍，而不是去做 formal verification。所谓测试用例其实很好理解，比方说我手上有一个函数 $f(x) = x^2$，那输入 $2$ 就应该输出 $4$，输入 $3$ 就应该输出 $9$，以此类推。所以只要写大量测试用例来检验一个输入是否能得到对应的输出就可以了，成本相对 formal verification 来说很低。因为 testing 本质上只检查有限 specific input 是否得到正确 output，而不是像 formal verification 那样在数学上证明对所有可能的 input 程序都满足要求。但现实里的问题往往要复杂很多的，总会有测试用例没覆盖到的 corner case；对大部分软件开发来说这些遗漏其实无伤大雅，我们每天在用的 Chrome 这类产品里其实就存在着大量已知和未知的 bug，做这种产品的核心逻辑是快速迭代而不是万无一失。这是一种 tradeoff，用户可以忍一忍小毛病，下一版更新里修一下就行了，但放到航空航天、加密货币这些场景里，一个没考虑到的 corner case 可能就直接出人命或者亏掉一大笔钱，这种时候才值得花成倍的成本去做 formal verification。

芯片设计其实也是同一个道理。一颗芯片一旦流片就没法再打补丁了，做出来的几百万颗里只要有一个 corner case 被触发，可能就是整批召回的损失。一个经典的例子是 1994 年 Intel Pentium 的 [FDIV bug](https://en.wikipedia.org/wiki/Pentium_FDIV_bug)，因为浮点除法在某些极端输入下会算错，最后 Intel 花了将近五亿美元做召回。所以现代芯片在 tape out 之前一般都会用大量 formal method 去证明设计在所有合法输入下都满足规约。

Theory 整体对数学背景的要求很高，平时的工作大多发生在白板上而不是在 IDE 里，论文里也几乎全是证明而不是实验。所以如果不是发自内心喜欢推理和证明，在这个方向上孤军奋战会比较辛苦。但反过来说，theory 的成果寿命也是 CS 里最长的，一篇好的算法论文常常会被引用几十年，而 systems 和 AI 那边因为技术迭代实在太快，五年前的 SOTA 现在可能已经没人提了。

## Systems：让 computation 真正跑起来

Systems 这个 cluster 是 CS 里 footprint 最大的一块，它涵盖了几乎所有让 computation 真正能在硬件上跑起来所需要的基础设施，从最底层的芯片设计一路往上到 OS、网络、数据库、PL、SE 等等。systems 的研究风格和 theory 几乎完全相反：theory 是在纸上推公式证定理，systems 则非常 hands-on，几乎每篇论文都要做出一个真实的原型，再去测它的性能（延迟、吞吐量、功耗这些），用实测数据来支撑自己的结论。所以 systems 的论文经常会附带很大体量的代码。

继续从算法竞赛的角度来看的话，algorithm 做的就是如何降低时间复杂度，而 systems 当然也做让算法跑得更快这件事（也就是优化常数），但实际上它负责的事情要比这个杂得多，还包括怎么让多线程不出 race condition、机器挂掉怎么不丢数据、给上层什么样的接口才好用等等。这些大多都跟跑得快不快没什么关系，但都是 systems 这条线要负责的事情。

CSRankings 把 systems 拆成了大约十几个子方向，下面挑几个比较有代表性的简单聊聊。

Computer Architecture 是 systems 里最贴近硬件的方向，研究的是 CPU、GPU、TPU 这些芯片内部应该怎么设计：cache 层级怎么组织、指令集是 RISC 还是 CISC、流水线怎么排、怎么处理分支预测和内存一致性等等。最近几年随着 [Moore's Law](https://en.wikipedia.org/wiki/Moore%27s_law) 慢慢失速，单纯堆晶体管的红利已经几乎没有了，所以 architecture 这条线的精力大量转向了为特定 workload（比如深度学习、图计算、cryptography）设计专门的加速器。Google 的 [TPU](https://en.wikipedia.org/wiki/Tensor_Processing_Unit)、NVIDIA 的 [Tensor Core](https://en.wikipedia.org/wiki/Volta_(microarchitecture)#Tensor_cores) 都是这个趋势的产物。

Operating Systems 主要研究 OS kernel 应该怎么设计：怎么调度进程、怎么管理内存、怎么处理 I/O、怎么实现文件系统等等。这个领域近些年比较活跃的几个方向包括 unikernel（把应用和内核合并成一个单一目的的二进制来榨干性能）、microkernel（把传统的 monolithic kernel 拆成多个 user-space service 来增强可靠性和安全性），以及针对新硬件（比如 persistent memory、SmartNIC、disaggregated memory）做的 OS 改造。

Networking 研究的是数据怎么在机器之间高效可靠地传输：从局域网内部的交换机设计，到跨数据中心的广域网，再到 Internet 上的路由协议，都属于这个领域。这两年这条线上很多研究都聚焦在数据中心网络上，因为云计算和大模型训练的需求，大家越来越关心怎么在数据中心内部做到极低延迟、不堵塞的通信。

High-Performance Computing 研究的是怎么把一份计算 scale 到成百上千、甚至上万颗核心上高效跑完。这条线传统的 application 是科学计算，比如气候模拟、流体力学、第一性原理材料计算，这些都是国家级超算每天在做的事，背后的数学本质是 PDE 求解、大规模线性代数这一类 numerical methods 的工作。说实话，我感觉 HPC 更像是 systems 领域里集大成者于一身的方向，既和 architecture、network 这些方向高度交叉，又要特别关注应用数学里的 numerical stability 这些细节。另外，这两年大模型训练其实就是直接跑在 HPC 几十年攒下来的那套基础设施上：GPU 集群、节点间高速互联、collective communication 这些本来就是 HPC 一直在做的事，所以可以说 HPC 就是整个大模型训练的基础。

这里顺带提一下 numerical methods，严格来说它是应用数学的一个分支，不是 CS systems 内部的方向，但因为它最常落地的计算平台就是 HPC，所以这两边的人经常一起工作。Numerical methods 解决的是数学和计算机之间一个根本的错位：数学本身是一门 precise language，就好比 $\pi$ 有严格的定义，但计算机只能用浮点数来近似存储数字，无法做到和数学一样精确，所以每一步运算都会引入一点误差。规模一大这些误差就会一路累积下去，处理不好整个结果就完全失去意义。Numerical methods 这个领域研究的就是怎么设计算法让误差受控、收敛性可证明、效率也能接受。这一套东西其实也正是大模型训练里最关键的一环。大模型训练本质上就是海量浮点运算的累加，numerical stability 一旦没处理好，loss 就会突然 spike、模型直接训崩，造成上千万美元的损失。这也是为什么像是 mixed precision（用 FP16 / BF16 / FP8 这种低精度格式提升性能，但这本身会 introduce stability 问题）、loss scaling（patch FP16 的 gradient underflow 问题）、还有更精细的 scaling 策略等等这些 numerical-systems 交叉的方向会是大模型训练的重头戏。

Database 研究的是怎么存、怎么索引、怎么查询大量数据。一个现代的数据库系统要解决的问题非常多：怎么在保证 [ACID](https://en.wikipedia.org/wiki/ACID) 的前提下做并发事务、怎么把查询分发到多台机器上、怎么优化 SQL 查询计划、怎么处理流式数据等等。这两年比较火的方向有内存数据库、云原生数据库（像 [Snowflake](https://en.wikipedia.org/wiki/Snowflake_Inc.)、[BigQuery](https://en.wikipedia.org/wiki/BigQuery) 这种），以及专门为大模型 retrieval 设计的向量数据库。

Programming Languages 研究的是编程语言本身：语言怎么设计、类型系统怎么搭、编译器怎么把高级代码翻译成机器码。不同语言其实代表着不同的设计 tradeoff，比如算法竞赛和高频交易常用的 C++ 给了用户完全的内存控制，速度很快但很容易 use-after-free、buffer overflow；Java、Python 这些用 garbage collector 接管内存，安全但有运行开销；Rust 这几年很火，靠 ownership 和 borrow checker 在编译期就把内存安全检查掉了，让用户既不用 GC 又能避开 C++ 那些最折磨人的错误。PL 这个领域和上面提到的 formal verification 有很深的交集，所以两边的社区有不少交流。

Security 这个子方向横跨的层次很广，从底层的硬件安全（比如 [Spectre](https://en.wikipedia.org/wiki/Spectre_(security_vulnerability))、[Meltdown](https://en.wikipedia.org/wiki/Meltdown_(security_vulnerability)) 这种侧信道攻击）到操作系统安全、网络安全，再到应用层的 web security 和 ML security，几乎每一层都有自己的攻击模型和防御机制。

Software Engineering 研究的是大规模代码库应该怎么组织、怎么测试、怎么维护。这个领域因为 AI 的兴起也变得非常活跃，比如程序合成、自动修 bug、自动写测试用例都是当下挺热的话题。需要说明的是，作为学术研究的 Software Engineering 和大厂里我们常说的 SWE（软件工程师）这个职业其实关系不大，只是名字一样而已。而 SWE 究竟是什么则会放在之后 career path 的部分详谈。

Systems 研究的问题大多来自真实的工程痛点，所以这个领域的学术界和工业界关系特别紧密。当然这也不是绝对的，像是刚才提到的 software engineering 就是一个反例：它作为 research topic 所关心的大规模代码库应该怎么组织、code review 怎么 scale、CI/CD pipeline 怎么设计这些问题，对于 Google 等大厂而言，因为自身 codebase 体量极大，早就 accumulate 了远超学术界的一手经验，相关 best practice 也往往是工业界先开发出来的。学术界里 software engineering researcher 的独特 contribution 是把这些 industry pattern 系统化，但最原始的 problem-solving frontier 确实往往都在工业界。

Systems 对人的要求和 theory 方向恰恰相反：它整体对工程能力的要求很高，平时的工作大多发生在终端和 profiler 里而不是在白板上，论文里也几乎全是 benchmark 和实测数据而不是数学证明。所以如果没有真的享受写代码、和真实硬件死磕的过程，这个方向会显得比较枯燥乏味。但从另一个角度来说，systems 的成果落地速度也是 CS 里最快的之一，一篇有分量的 paper 几年之内就有可能被工业界吸收成为标准实践，在博士期间就有可能看到自己亲手搭出来的系统真的被部署。

## AI：让计算机从感知到决策

AI 是 CS 里这几年发展最快、关注度最高的方向，几乎不用过多介绍。但 AI 内部其实也分了很多不同的子方向，下面简单展开一下。

CSRankings 把 AI 大致分成 AI（general）、Computer Vision、Machine Learning & Data Mining、Natural Language Processing、Web & Information Retrieval 这几个方向。但说实话，自从 [transformer](https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)) 在 2017 年横空出世、之后又催生出 GenAI 这一波浪潮以来，这些子方向之间的界限已经越来越模糊。以前 vision 和 NLP 是两个相对独立的社区，现在大家都用同一套 backbone（transformer）和同一套范式（pretrain + finetune），多模态模型也开始一统天下。所以下面我会按照现在实际的研究 landscape 来讲，而不严格遵循 CSRankings 的分类。

Foundation Model 是这两年最热的方向。它的核心问题是怎么训练一个能在很多任务上泛化的模型，具体研究的子问题包括架构设计（attention 机制怎么改、怎么处理长上下文）、训练（pretraining 的数据配比、scaling law、RLHF 这些）、推理（怎么加速、怎么量化、怎么做 speculative decoding）以及评测（怎么设计真正能衡量模型能力的 benchmark）等等。这个方向非常依赖算力，很多最前沿工作只能在 industry lab（OpenAI、Anthropic、Google DeepMind 等）里做，因为学术界很难拥有训练一个前沿模型所需要的那种规模的 GPU 集群。

Computer Vision 研究模型怎么理解图像和视频，具体任务包括分类、检测、分割、生成等等。在大模型时代之前，CV 是一个相对自洽的方向，有自己的 backbone（[ResNet](https://en.wikipedia.org/wiki/Residual_neural_network)、[ViT](https://en.wikipedia.org/wiki/Vision_transformer) 这些）和自己的任务集；但现在 vision 越来越多地被合并到多模态模型里去了。生成这条线目前也很活跃，[diffusion model](https://en.wikipedia.org/wiki/Diffusion_model)、视频生成都是当下的热点。

Natural Language Processing 研究模型怎么理解和生成自然语言。这个领域基本已经被 LLM 重塑了。以前的 NLP 任务（翻译、摘要、问答这些）现在都成了 LLM 的下游应用，所以 NLP 的研究重心也很大程度上转移到了 LLM 本身的能力和对齐上。

Reinforcement Learning 研究的是 agent 怎么通过和环境交互学到一个最优策略。RL 在过去十年走过一段挺有意思的路：曾经它最有名的应用是下棋打游戏（[AlphaGo](https://en.wikipedia.org/wiki/AlphaGo)、[AlphaStar](https://en.wikipedia.org/wiki/AlphaStar_(software))），后来一度被认为不太实用；但近两年 [RLHF](https://en.wikipedia.org/wiki/Reinforcement_learning_from_human_feedback) 让它在 LLM 训练里成了不可或缺的一环，又重新回到了聚光灯下。这两年的 reasoning model（OpenAI 的 o 系列、DeepSeek 的 R 系列）更是把 RL 推到了 LLM 训练流水线的中心位置。

ML Theory 研究的是 ML 的数学性质：为什么深度网络能泛化、optimization landscape 长什么样、为什么超参数化的模型不会过拟合等等。这个方向和前面 theory 那部分其实有挺深的交集，需要很强的数学功底。

AI for Science 是这几年才崛起的一个交叉方向，主要把 ML 用在具体的科学问题上。最有名的例子是 DeepMind 的 [AlphaFold](https://en.wikipedia.org/wiki/AlphaFold)，它基本解决了 [protein structure prediction](https://en.wikipedia.org/wiki/Protein_structure_prediction) 这个生物学界悬而未决五十年的问题，并因此拿到了 2024 年的诺贝尔化学奖。除此之外 AI for math、AI for materials science 这些也都是越来越受关注的方向。顺带提一句，如何使用 AI 做前面在理论方向中提到的 formal verification 从而降低其成本其实就是现在 AI for math 这个领域内最重要的研究问题之一。

说实话我觉得 AI 这个方向更像是 theory 和 systems 融合的产物，跨度非常之广。这个领域的研究既可以非常偏向理论又可以非常偏向系统。所以这也就对人的要求特别高。最顶尖的 AI researcher 往往都是数学和工程两手都过硬的 full-stack researcher，既能推 scaling law 这些理论分析，又能在几千张 GPU 上把一整套训练流程稳定跑起来。这种 profile 在任何其他 CS 子领域里都不算多见，但在 AI 领域几乎已经成了顶级 lab 的标配。

此外，从个人发展的角度来说，AI 大概是目前 CS 里钱最多、就业最好的方向之一，但与此同时也极度内卷、迭代极快，一篇 paper 挂到 arxiv 上，三个月之后可能就过时了。所以在这个方向待下去需要一种特别的心态：既要跟得上社区的节奏，又要在各种 hype 里保持判断力，不被裹挟。

## Interdisciplinary：CS 和其他学科的交叉

最后一个 cluster 是 interdisciplinary，也就是 CS 和别的学科之间的交叉地带。这部分的子方向大多是把 CS 的方法和工具用到某个具体领域的问题上，所以做这条线一般需要双重背景。下面挑几个有代表性的方向简单展开。

Computational Biology / Bioinformatics 是把 CS 用在生物学问题上的方向。具体的任务包括基因测序、蛋白质结构预测、药物发现、单细胞分析这些，前面提到的 AlphaFold 也算这个领域的标志性成果。这条线因为生物学本身的数据规模和复杂度都在飞速增长，加上 ML 工具又越来越强，未来很长一段时间大概率都会是一个增长方向。

Computer Graphics 研究的是怎么用计算机生成、表示、操作视觉内容，像电影特效、游戏渲染、3D 建模、物理仿真都属于这个范畴。近些年随着 VR/AR 的发展和 generative model 的进步，这个领域也变得越来越活跃，比如 [NeRF](https://en.wikipedia.org/wiki/Neural_radiance_field)、[Gaussian Splatting](https://en.wikipedia.org/wiki/Gaussian_splatting) 这些技术就是把传统 graphics 和现代 ML 结合起来的成功案例。

Human-Computer Interaction 研究的是人和计算机之间的交互：UI/UX 怎么设计、accessibility 怎么处理、AR/VR 怎么做、新型输入设备怎么设计。HCI 是 CS 里最 user-facing 的方向之一，所以它的研究经常会涉及用户研究、心理学这些传统上不算 CS 的方法论。当然现在随着 GenAI 的爆发也有不少人开始研究 AI 和人的交互以及对社会的影响，这些也都属于 HCI 的范畴。

Robotics 研究的是怎么让物理 agent 在真实世界里感知、推理、行动。这个领域天然横跨 ML、控制理论、机械工程等好几个学科。最近随着 LLM 的进步，把 LLM 当作机器人的高层规划器也成了一个挺活跃的研究方向。

Economics & Computation 是 CS 和经济学的交叉，某种程度上和 Operations Research 挺像的，研究的问题包括机制设计（比如一场拍卖怎么设计才能让大家诚实出价）、algorithmic game theory、市场设计这些。这条线和工业界的关系也挺紧密，Google、Meta 这些公司的广告竞价系统背后就有大量这方面的研究在支撑。

Visualization 研究的是怎么把高维或者复杂的数据用人能看懂的方式展示出来。这个方向虽然小众，但在数据科学、科学计算这些场景里非常重要。

CS Education 研究的是 CS 应该怎么教。具体研究的问题包括语言设计（怎么设计一种对初学者友好的编程语言）、教学法（怎么教抽象、怎么教递归）以及 access equity（怎么让更多 underrepresented group 进入这个学科）等等。

Interdisciplinary 这个 cluster 整体的选择面非常广，适合那些除了 CS 还对某个具体领域有兴趣的人。它另外一个好处是：因为问题来源比较多样，funding 也比较分散，所以受单一领域 hype 周期的影响相对小一些。

回到文章开头的问题：上了大学以后会发现 CS 是一门什么样的学科？对我自己来说最大的体会就是：CS 比高中阶段接触的 coding 和算法竞赛要广得多。它既可以是一门极其数学的学科（看 theory 那部分），也可以是一门极其工程的学科（看 systems 那部分），还可以是一门和几乎任何其他学科交叉的学科（甚至包括法律、哲学等等）。每个人都能在里面找到一个适合自己背景和兴趣的方向，这也是我开头提到的 horizontal heterogeneity 的真正含义。
