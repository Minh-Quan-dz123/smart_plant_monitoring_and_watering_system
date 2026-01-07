package com.example.project_iot_auto_watering.ui.history

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.repository.GardenRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.databinding.FragmentHistoryBinding
import com.example.project_iot_auto_watering.ui.history.adapter.LogAdapter
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenVMFactory
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenViewModel
import kotlinx.coroutines.launch

class FragmentHistory : Fragment(), View.OnClickListener {
    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!

    private lateinit var logRcv: RecyclerView
    private lateinit var logAdapter: LogAdapter

    private val gardenRepository= GardenRepository(RetrofitInstance.api)
    private lateinit var gardenViewModel: GardenViewModel

    private var idGarden=-1
    private var tokenAuth=""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        tokenAuth=requireContext().getSharedPreferences("Auth", Context.MODE_PRIVATE).getString("token","").toString()

        initListener()
        initAdapter()
        initViewModel()
        getLogGarden()
        initObserve()
    }

    private fun initAdapter(){
        logRcv=binding.rcvHistory
        logAdapter= LogAdapter(){
            gardenViewModel.deleteLog(idGarden,tokenAuth){m->
                Toast.makeText(requireContext(),"Xóa: $m", Toast.LENGTH_SHORT).show()
            }
        }
        logRcv.adapter=logAdapter
        logRcv.layoutManager= LinearLayoutManager(requireContext())
    }
    private fun initViewModel(){
        gardenViewModel= ViewModelProvider(requireActivity(), GardenVMFactory(gardenRepository))[GardenViewModel::class.java]
        idGarden=gardenViewModel.idGarden
    }
    private fun initObserve(){
        gardenViewModel.listLog.observe(viewLifecycleOwner){list->
            logAdapter.submitList(list)
        }
    }

    private fun getLogGarden(){
        lifecycleScope.launch {
            gardenViewModel.getLogGarden(idGarden,tokenAuth){}
        }
    }

    private fun initListener(){
        binding.iconBack.setOnClickListener(this)
    }

    override fun onClick(p0: View?) {
        when(p0?.id){
            R.id.icon_back->{
                findNavController().popBackStack()
            }
        }
    }
}